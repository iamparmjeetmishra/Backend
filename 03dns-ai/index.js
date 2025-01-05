import {
	startUdpServer,
	createResponse,
	createTxtAnswer,
} from "denamed";
import { GoogleGenerativeAI } from "@google/generative-ai";

import 'dotenv/config'


const GEMINI_KEY = process.env.GEMINI_API_KEY;
// console.log(GEMINI_KEY)
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const model = genAI.getGenerativeModel({
	model: "gemini-1.5-flash-8b",
});

startUdpServer(
	async (query) => {
		// console.log(query);
		const question = query.questions[0];

		const prompt = `
		Answer the question in one word or sentence.
		Question: ${question.name.split(".").join(" ")}
		`;

		const result = await model.generateContent(prompt)

		console.log(result)

		return createResponse(query, [
			createTxtAnswer(question, result.response.text()),
		]);
	},
	{ port: 8000 }
);

// dig TXT @localhost -p 8000 what.is.1024.bytes
// dig TXT @localhost -p 8000 +short what.is.1024.bytes


// {
//   queryResponse: 0,
//   operationCode: 0,
//   authoritativeAnswer: false,
//   truncation: false,
//   recursionDesired: true,
//   recursionAvailable: false,
//   authenticatedData: true,
//   checkingDisabled: false,
//   responseCode: 0,
//   id: 64927,
//   questions: [ { name: 'parm', type: 'TXT' } ],
//   answers: undefined,
//   authorities: undefined,
//   additional: [ { type: 'OPT', ttl: 0, name: '', class: 1232, data: [Object] } ]
// }


// With AI
// ; <<>> DiG 9.20.4 <<>> TXT @localhost -p 8000 what.is.1024.bytes
// ; (2 servers found)
// ;; global options: +cmd
// ;; Got answer:
// ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 15973
// ;; flags: qr rd ad; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0
// ;; WARNING: recursion requested but not available
// ;; WARNING: Message has 1 extra bytes at end

// ;; QUESTION SECTION:
// ;what.is.1024.bytes.            IN      TXT

// ;; ANSWER SECTION:
// what.is.1024.bytes.     60      IN      TXT     "1 kilobyte (KB).\010"

// ;; Query time: 2150 msec
// ;; SERVER: ::1#8000(localhost) (UDP)
// ;; WHEN: Sun Jan 05 19:34:19 IST 2025
// ;; MSG SIZE  rcvd: 67
