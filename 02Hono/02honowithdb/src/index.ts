import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import dbConnect from "./db/connect";
import YoutubeVideoModel from "./db/model";
import { isValidObjectId } from "mongoose";
import { Context } from "hono";
import { streamText } from "hono/streaming";

// Define a type for the request body to ensure type safety

const app = new Hono();

// Middleware
app.use(poweredBy());
app.use(logger());

// Connect to the database
dbConnect()
	.then(() => {
		// Get all documents
		app.get("/", async (c: Context) => {
			try {
				const documents = await YoutubeVideoModel.find();
				return c.json(documents, 200);
			} catch (error) {
				return c.json({ error: (error as Error).message || "Failed to fetch documents" }, 500);
			}
		});

		// Create a new document
		app.post("/", async (c: Context) => {
			try {
				const formData = (await c.req.json());
				if (!formData.thumbnailUrl) delete formData.thumbnailUrl;

				const newVideo = new YoutubeVideoModel(formData);
				const savedVideo = await newVideo.save();
				return c.json(savedVideo, 201);
			} catch (error) {
				return c.json({ error: (error as Error).message || "Failed to create document" }, 500);
			}
		});

		// Get a document by ID
		app.get("/:id", async (c: Context) => {
			const id = c.req.param("id");

			if (!isValidObjectId(id)) return c.json({ error: "Invalid ID" }, 400);

			try {
				const document = await YoutubeVideoModel.findById(id);
				if (!document) return c.json({ error: "Document not found" }, 404);

				return c.json(document, 200);
			} catch (error) {
				return c.json({ error: (error as Error).message || "Failed to fetch document" }, 500);
			}
		});

		// Stream a document's description by ID
		app.get("/alldata/:id", async (c: Context) => {
			const id = c.req.param("id");

			if (!isValidObjectId(id)) return c.json({ error: "Invalid ID" }, 400);

			try {
				const document = await YoutubeVideoModel.findById(id);
				if (!document) return c.json({ error: "Document not found" }, 404);

				return streamText(c, async (stream) => {
					stream.onAbort(() => {
						console.log("Stream aborted");
					});

					for (const char of document.description) {
						await stream.write(char);
						await stream.sleep(400); // Sleep for 400ms between writes
					}
				});
			} catch (error) {
				return c.json({ error: (error as Error).message || "Failed to stream data" }, 500);
			}
		});

		// Update a document by ID
		app.patch("/:id", async (c: Context) => {
			const id = c.req.param("id");

			if (!isValidObjectId(id)) return c.json({ error: "Invalid ID" }, 400);

			try {
				const formData = (await c.req.json());
				if (!formData.thumbnailUrl) delete formData.thumbnailUrl;

				const updatedDocument = await YoutubeVideoModel.findByIdAndUpdate(id, formData, { new: true });
				if (!updatedDocument) return c.json({ error: "Document not found" }, 404);

				return c.json(updatedDocument, 200);
			} catch (error) {
				return c.json({ error: (error as Error).message || "Failed to update document" }, 500);
			}
		});

		// Delete a document by ID
		app.delete("/:id", async (c: Context) => {
			const id = c.req.param("id");

			if (!isValidObjectId(id)) return c.json({ error: "Invalid ID" }, 400);

			try {
				const deletedDocument = await YoutubeVideoModel.findByIdAndDelete(id);
				if (!deletedDocument) return c.json({ error: "Document not found" }, 404);

				return c.json(deletedDocument, 200);
			} catch (error) {
				return c.json({ error: (error as Error).message || "Failed to delete document" }, 500);
			}
		});
	})
	.catch((err) => {
		console.error("Failed to connect to MongoDB:", err);
		app.get("/*", (c: Context) => c.text(`Failed to connect to MongoDB: ${err.message}`, 500));
	});

// Global error handler
app.onError((err, c: Context) => {
	console.error("Application Error:", err);
	return c.text(`App Error: ${err.message}`, 500);
});

export default app;
