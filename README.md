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


Not Perfect
===========
The generated TypeScript declaration file gets its info from the meta data attached to the qooxdoo classes. Sometimes there might be a mistake in there, which would also result into a mistake in the declaration file. 
But you can always cast an object to <any> and do amything you like with it.
