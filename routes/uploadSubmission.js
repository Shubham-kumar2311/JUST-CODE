 const languageMap = {
    "cpp": {
        id: 54,
        defaultCode: 
        "#include <iostream>\n"
        + "using namespace std;\n\n"
        + "int main() {\n"
        + '\tcout << "Hello World!";\n'
        + "\treturn 0;\n"
        + "}",
    },
    "java": {
        id: 91,
        defaultCode: `public class Main {
            public static void main(String[] args) {
                System.out.println("Hello World!");
            }
    }`,
    },
    "python": {
        id: 71,
        defaultCode: `print("Hello World!")`,
    },
    "javascript": {
        id: 102,
        defaultCode: `console.log("Hello World!");`,
    }
}

const url = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false&fields=*';

const headers = {
    'x-rapidapi-key': 'd553617f06mshd593462da4bb13cp10bc29jsne045fda800e3',
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
    'Content-Type': 'application/json'
};

const data = {
    language_id: 102,
    source_code: btoa(`console.log("hello")`),
    stdin :  btoa("")
};

async function callApi() {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        const result = await res.json();
        console.log("Submission Response:", result);

        if (result.token) {
            console.log("Fetching submission result...");
            let a = await getSubmission(result.token);
            console.log(atob(a.stdout))
        }
    } catch (error) { 
        console.error("Error occurred:", error);
    }
}

// Improved getSubmission function using fetch
async function getSubmission(tokenId) {
    try {
        const submissionUrl = `https://judge0-ce.p.rapidapi.com/submissions/${tokenId}?base64_encoded=true&fields=*`;

        const res = await fetch(submissionUrl, {
            method: 'GET',
            headers: headers
        });

        const result = await res.json();
        console.log("Submission Result:", result);
        return result
    } catch (error) {
        console.error("Error fetching submission result:", error);
    }
}

callApi();


