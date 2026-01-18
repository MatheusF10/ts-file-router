import { Biome, Distribution } from '@biomejs/js-api';
import { TRouteLeaf, TRoutesTree } from '../types.js';
import ts from 'typescript';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { OpenProjectResult } from '@biomejs/wasm-nodejs';

const biomeInstance = {
  biome: null as Biome | null,
  project: null as OpenProjectResult | null,
};

const getBiomeSingleton = async () => {
  if (!biomeInstance.biome) {
    biomeInstance.biome = await Biome.create({
      distribution: Distribution.NODE,
    });
  }

  if (!biomeInstance.project) {
    biomeInstance.project = biomeInstance.biome.openProject();

    biomeInstance.biome.applyConfiguration(biomeInstance.project.projectKey, {
      formatter: { enabled: true, indentStyle: 'space', lineWidth: 100 },
      javascript: { formatter: { quoteStyle: 'single' } },
    });
  }

  return {
    biome: biomeInstance.biome,
    projectKey: biomeInstance.project.projectKey,
  };
};

// Type guard
const isRouteLeaf = (value: unknown): value is TRouteLeaf => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'path' in value &&
    'import' in value
  );
};

const createRouteObject = (obj: TRoutesTree): ts.Expression => {
  const properties = Object.entries(obj).map(([key, value]) => {
    if (isRouteLeaf(value)) {
      return ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier(key),
        ts.factory.createObjectLiteralExpression(
          [
            ts.factory.createPropertyAssignment(
              'path',
              ts.factory.createStringLiteral(value.path),
            ),
            ts.factory.createPropertyAssignment(
              'import',
              ts.factory.createCallExpression(
                ts.factory.createIdentifier('import'),
                undefined,
                [ts.factory.createStringLiteral(value.import)],
              ),
            ),
          ],
          true,
        ),
      );
    }

    // Recursive object
    return ts.factory.createPropertyAssignment(
      ts.factory.createIdentifier(key),
      createRouteObject(value),
    );
  });

  return ts.factory.createObjectLiteralExpression(properties, true);
};

const createRoutesFile = (obj: TRoutesTree): ts.SourceFile => {
  const routesObject = createRouteObject(obj);

  // Create AST from routes variable
  const exportStatement = ts.factory.createVariableStatement(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          'routes',
          undefined,
          undefined,
          ts.factory.createAsExpression(
            routesObject,
            ts.factory.createTypeReferenceNode('const'),
          ),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );

  // Add the comment
  ts.addSyntheticLeadingComment(
    exportStatement,
    ts.SyntaxKind.SingleLineCommentTrivia,
    ' GENERATED WITH TS-FILE-ROUTER DO NOT EDIT',
    true,
  );

  // Create the source file
  return ts.factory.createSourceFile(
    [exportStatement],
    ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None,
  );
};

const formatAndWriteOutputFile = async (filePath: string, code: string) => {
  const biomeSingleton = await getBiomeSingleton();

  const formatted = biomeSingleton.biome.formatContent(
    biomeSingleton.projectKey,
    code,
    { filePath: path.basename(filePath) },
  );

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  fs.writeFileSync(filePath, formatted.content, 'utf8');
};

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

const serializeOutputFile = async (routes: TRoutesTree, outputPath: string) => {
  const code = createRoutesFile(routes);

  try {
    await formatAndWriteOutputFile(
      path.resolve(outputPath),
      printer.printFile(code),
    );

    console.log('✨ File was parsed succesfully');
  } catch (err) {
    console.error('❌ Error parsing file:\n', err);
  }
};

export const SerializeHelper = {
  isRouteLeaf,
  serializeOutputFile,
  formatAndWriteOutputFile,
} as const;
