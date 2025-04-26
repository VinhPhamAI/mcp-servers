import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SequentialThinkingServer, SEQUENTIAL_THINKING_TOOL } from "./index.js";

const app = express();

const server = new Server(
  {
    name: "sequential-thinking-server",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const thinkingServer = new SequentialThinkingServer();

let transport: SSEServerTransport;

app.get("/sse", async (req: Request, res: Response) => {
  console.log("Received connection");
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

app.post("/message", async (req: Request, res: Response) => {
  console.log("Received message");
  await transport.handlePostMessage(req, res);
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [SEQUENTIAL_THINKING_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "sequentialthinking") {
    return thinkingServer.processThought(request.params.arguments);
  }

  return {
    content: [{
      type: "text",
      text: `Unknown tool: ${request.params.name}`
    }],
    isError: true
  };
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});