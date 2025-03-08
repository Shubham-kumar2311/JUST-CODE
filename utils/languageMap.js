const languageMap = {
    cpp: {
      id: 54,
      defaultCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n\tcout << \"Hello World!\";\n\treturn 0;\n}",
    },
    java: {
      id: 91,
      defaultCode: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}`,
    },
    python: {
      id: 71,
      defaultCode: `print("Hello World!")`,
    },
    javascript: {
      id: 102,
      defaultCode: `console.log("Hello World!");`,
    },
  };
  
module.exports = languageMap;