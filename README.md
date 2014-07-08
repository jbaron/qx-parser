Introduction
============
This application generates a TypeScript declaration file for the Qooxdoo framework. It uses the API files (JSON format) 
of Qooxdo to do so.

PLease note that the generated file is not 100% ok and still need a few manual chnages to compile correctly and be 
usable in your project.

If you are just interested in using the Qooxdoo within a typescript project, better to use the project
qx-typed. This project has a working declaration file and also some glue so you can start right away.

You can get it from: https://github.com/jbaron/qx-typed


Using it
=========
Simple make sure you have nodejs installed and then run it:

    node main.js


Building it
============
You will need TypeScript installed on your machine. Then you can build with:

    tsc -m commonjs main.ts node.d.ts

There is a also a build.sh script provided that first build the project and then runs it.


Todo
==========
There are a few things still to be done to create a better output file:

1) Use even smarter ways to get type info (like from referenced properties)
2) Some paramters have multiple types, right now just picking the first one. 
   Could use the TypeScript overloading to deal with this.
