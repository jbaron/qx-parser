Introduction
============
This application generates a TypeScript declaration file for the Qooxdoo framework. It uses the API files (JSON format) 
of Qooxdoo to do so.

Please note that the generated declaration file is not 100% OK and still need a few manual tweaks to compile correctly 
and be usable in your project.

If you are just interested in using the Qooxdoo within a typescript project, better to use the project
qx-typed. This project has a fully functional declaration file and also some glue so you can start right away.

You can get it from: https://github.com/jbaron/qx-typed


Using it
=========
Simple make sure you have nodejs installed and then run it:

```
npm start
```

You will find a new `qooxdoo.d.ts` file in the root directory of the project. 


Building it
============
You will need TypeScript installed on your machine. Then you can build this project simply by running:

```
tsc 
```

The file named tsconfig.json is used by `tsc` to get its configuration from.


Todo
==========
There are a few things still to be done to create a better output file:

1) Use smarter ways to get type info (like from referenced properties)
2) Some parameters have multiple types, right now we are just picking the first one. 
   Could use the TypeScript Union Types to deal with this.
3) Ensure that the resulting declaration file is 100% correct TypeScript.
