# expenses

![build status](https://github.com/nihalgonsalves/expenses/workflows/build/badge.svg)
![last commit](https://img.shields.io/github/last-commit/nihalgonsalves/expenses)

Scripts:

- `yarn dev` run from source, auto-restarting
- `yarn lint` run eslint
- `yarn lint --fix` run eslint with auto-formatting
- `yarn build` build to JS
- `yarn start` run built JS
- `yarn test` currently does nothing

## use with react

```diff
diff --git a/.eslintrc b/.eslintrc
index e755856..bbaeee5 100644
--- a/.eslintrc
+++ b/.eslintrc
@@ -1,3 +1,6 @@
{
-  "extends": ["./node_modules/@nihalgonsalves/esconfig/.eslintrc"]
+  "extends": [
+    "./node_modules/@nihalgonsalves/esconfig/.eslintrc",
+    "./node_modules/@nihalgonsalves/esconfig/.eslintrc.react"
+  ]
}
```
