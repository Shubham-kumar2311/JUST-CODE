// controllers/aiController.js
const http = require('https');
const prettier = require("prettier");
const { execSync } = require("child_process");

function formatCode(code, language) {
    try {
      switch (language) {
        case "javascript":
          return prettier.format(code, { parser: "babel" });
  
        case "java":
          return prettier.format(code, {
            parser: "java",
            plugins: ["prettier-plugin-java"],
          });
  
        case "python":
          return execSync(`echo ${JSON.stringify(code)} | black -q -`, {
            encoding: "utf-8",
          }).trim();
  
        case "c":
        case "cpp":
          return execSync(`echo ${JSON.stringify(code)} | clang-format`, {
            encoding: "utf-8",
          }).trim();
  
        default:
          console.error("Unsupported language:", language);
          return code; // Return original code if unsupported
      }
    } catch (error) {
      console.error("Formatting Error:", error);
      return code; // Return original if formatting fails
    }
  }

// Configuration for RapidAPI chatgpt-42 endpoint
const options = {
    method: 'POST',
    hostname: 'chatgpt-42.p.rapidapi.com',
    port: null,
    path: '/o3mini',
    headers: {
        'x-rapidapi-key': 'd553617f06mshd593462da4bb13cp10bc29jsne045fda800e3', // Replace with your RapidAPI key
        'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
        'Content-Type': 'application/json',
    },
};

// Helper function to make HTTP request to RapidAPI
const makeRapidAPIRequest = (prompt) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, function (res) {
            const chunks = [];

            res.on('data', function (chunk) {
                chunks.push(chunk);
            });

            res.on('end', function () {
                const body = Buffer.concat(chunks);
                try {
                    const response = JSON.parse(body.toString());
                    resolve(response);
                } catch (error) {
                    reject(new Error('Failed to parse response: ' + error.message));
                }
            });
        });

        req.on('error', function (error) {
            reject(error);
        });

        req.write(
            JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                web_access: false,
            })
        );
        req.end();
    });
};

// Helper function to normalize indentation
const normalizeIndentation = (code, language) => {
    const lines = code.split('\n').map(line => line.trimEnd()); // Remove trailing whitespace
    let normalizedLines = [];
    let currentIndentLevel = 0;
    const indentUnit = language === 'python' ? '    ' : '  '; // Use 4 spaces for Python, 2 for others

    for (let line of lines) {
        if (!line.trim()) {
            normalizedLines.push(''); // Preserve empty lines
            continue;
        }

        // Count leading spaces or tabs in the original line
        const leadingWhitespace = line.match(/^\s*/)[0];
        const indentCount = leadingWhitespace.replace(/\t/g, indentUnit).length / indentUnit.length;

        // Determine new indent level based on language-specific rules
        if (language === 'python') {
            currentIndentLevel = indentCount;
        } else {
            if (line.includes('{')) currentIndentLevel++;
            if (line.includes('}')) currentIndentLevel = Math.max(0, currentIndentLevel - 1);
        }

        // Apply new indentation
        const newIndent = indentUnit.repeat(Math.max(0, currentIndentLevel));
        normalizedLines.push(newIndent + line.trimStart());
    }

    return normalizedLines.join('\n').trimEnd();
};

// Helper function to extract code from the response and normalize indentation
const extractCodeFromResponse = (responseText, language) => {
    let extractedCode = '';

    // Look for code block delimiters (e.g., ```java ... ``` or ``` ... ```)
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)\n```/;
    const match = responseText.match(codeBlockRegex);

    if (match && match[1]) {
        extractedCode = match[1].trim();
    } else {
        // If no code block is found, try to return the response as-is after stripping explanations
        const lines = responseText.split('\n');
        const codeLines = lines.filter(line => !line.match(/^(###|Explanation|Below is|This code|\d+\.)/i));
        extractedCode = codeLines.join('\n').trim();
    }

    // Remove extra quotes and language identifiers
    extractedCode = extractedCode
        .replace(/^["'`]+|["'`]+$/g, '') // Remove leading/trailing quotes
        .replace(new RegExp(`^${language}\\s*\\n`, 'i'), '') // Remove language identifier followed by newline
        .trim();

    // Normalize indentation
    return normalizeIndentation(extractedCode, language);
};

// Helper function to extract suggestion from the response (for askAI)
const extractSuggestionFromResponse = (responseText) => {
    // Remove code blocks and explanations, keep only the suggestion text
    const withoutCodeBlocks = responseText.replace(/```(?:\w+)?\n[\s\S]*?\n```/g, '');
    const lines = withoutCodeBlocks.split('\n');
    const suggestionLines = lines.filter(line => !line.match(/^(###|Explanation|Below is|This code|\d+\.)/i));
    console.log(suggestionLines.join('\n').trim())
    return suggestionLines.join('\n').trim();
};

// Controller for handling "Ask AI" functionality
exports.askAI = async (req, res) => {
    try {
        const { code, language, problemDescription, query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: "Query is required",
            });
        }

        const prompt = `
      Problem: ${problemDescription}
      Language: ${language}
      Current Code: ${code}
      User Query: ${query}

      Please provide a response to the user's query based on the code and problem description.
      Don't give any type of explaination , just give a  litttle comment nothing else it should be strictly prohibited
      and also give result in indentation
    `;

        const response = await makeRapidAPIRequest(prompt);

        // Assuming the response contains a field like `result` with the AI's suggestion
        const rawResponse = response.result || response.content || JSON.stringify(response);
        const suggestion = extractCodeFromResponse(rawResponse,language);

        res.json({
            success: true,
            suggestion: suggestion || "No suggestion provided",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

// Controller for handling "Correct Syntax" functionality using AI
exports.correctSyntax = async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: "Code and language are required",
            });
        }

        // Prepare the prompt for AI to correct syntax
        const prompt = `
      You are an expert code syntax corrector. 
      Below is a piece of code written in ${language}. 
      Your task is to correct any syntax errors in the code without 
      adding extra lines of code, changing the logic, or adding new functionality. 
      Only fix syntax issues (e.g., missing semicolons, incorrect indentation, unbalanced parentheses).
      If there are no syntax errors, return the code unchanged.

      Code:
      \`\`\`
      ${code}
      \`\`\`

      Return only the corrected code as plain text,
      without any explanations or additional comments. 
      If the code is already syntactically correct, return it as-is.
    `;

        const response = await makeRapidAPIRequest(prompt);

        // Assuming the response contains a field like `result` with the corrected code
        const rawResponse = response.result || response.content || JSON.stringify(response);
        const correctedCode = extractCodeFromResponse(rawResponse, language);

        // Compare original and corrected code to determine if changes were made
        const hasChanges = correctedCode !== code.trim();

        res.json({
            success: true,
            correctedCode: hasChanges ? correctedCode : null,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};


