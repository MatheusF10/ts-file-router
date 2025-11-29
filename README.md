📁 TS File Router

TS File Router is a lightweight, zero-dependency file-based routing generator for TypeScript and React projects.
It scans your project’s folder structure, validates route files, and automatically generates a strongly-typed routes.ts file for dynamic imports.

🚀 Features

🔍 Recursive directory scanning

🛡 Ensures every folder contains a required route file (e.g., page.ts)

🏗 Generates a clean, fully typed routes.ts file

⚡ Perfect for React.lazy and dynamic imports

🧩 Zero external dependencies

📁 Normalized import paths

📜 Fully customizable file names and output paths

📂 Expected Folder Structure
pages/
  page.ts
  payments/
    page.ts
  dashboard/
    page.ts
    settings/
      page.ts


Each folder must contain the required route file (default: page.ts).

🛠 Installation
npm install


or

yarn install

⚙ Configuration

Use the startRouter function to configure how the router is generated:

startRouter({
  baseFolder: 'pages',
  outputFile: 'routes.ts',
  routeFileName: 'page.ts', // optional
});

Options
Property	Type	Default	Description
baseFolder	string	—	Folder you want to scan for routes
outputFile	string	—	Path for the generated output file
routeFileName	string	"page.ts"	Required file in every folder
▶ Usage

Run your generator script:

npm run generate:routes


or

node generate-routes.js


This will automatically create a:

routes.ts


file based on your folder structure.

📘 Example of Generated Output
// THIS FILE IS AUTO-GENERATED

const routes = {
  page: {
    path: "./",
    import: "./page.ts"
  },
  payments: {
    page: {
      path: "./payments",
      import: "./payments/page.ts"
    }
  }
};

export default routes;

🎯 Using With React
import React from 'react';
import routes from './routes';

const PaymentsPage = React.lazy(() =>
  import(routes.payments.page.import).then(m => ({ default: m.default }))
);

🔒 Automatic Validations

TS File Router ensures:

Every directory contains a required file (page.ts or custom)

The root directory is always valid

No folder is processed without a route file

Output file is always safely generated

If a folder is missing the route file, an error is thrown:

Error: The folder "payments" must contain a page.ts file.

🧩 Contributing

PRs are welcome!
Feel free to suggest improvements, new features, or optimizations.

📜 License

MIT License — feel free to use it personally or commercially.

If you want, I can also:

✅ Add Shields.io badges (version, license, build)
✅ Add an ASCII logo or SVG logo
✅ Add CLI usage documentation
✅ Add a "Why TS File Router?" section or comparison with other routers

Would you like any of those enhancements?
