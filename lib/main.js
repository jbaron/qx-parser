"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
/**
 * The different types referred to in the JSON API file
 */
class Types {
}
Types.Class = "class";
Types.Methods = "methods";
Types.MethodsStatic = "methods-static";
Types.Method = "function";
Types.Constructor = "constructor";
Types.Properties = "properties";
Types.Property = "property";
Types.Return = "return";
Types.Types = "types";
Types.Entry = "entry";
Types.Param = "param";
var ClassType;
(function (ClassType) {
    ClassType[ClassType["interface"] = 0] = "interface";
    ClassType[ClassType["class"] = 1] = "class";
})(ClassType || (ClassType = {}));
const indent = "    ";
// This is the string that contains the full declaration
const time = new Date();
let output = `// Generated declaration file at ${time}\n`;
/**
 * Write a piece of code to the declaration file
 */
function write(msg) {
    output += msg;
}
/**
 * This class loads the Qooxdoo API files that are passed to the constructor
 * and generates a declaration file out of that.
 */
class Parser {
    constructor() {
        this.processedMethods = {};
        this.properties = {};
        this.fromProperty = null;
        this.loadTypeMappings();
        this.loadFileNames();
    }
    run() {
        this.writeBase();
        this.fileNames.forEach((fileName) => {
            if ((!fileName) || (fileName.indexOf("//") === 0))
                return;
            try {
                const src = this.loadAPIFile(fileName);
                // Reset the global methods list.
                this.processedMethods = {};
                this.properties = {};
                this.writeModule(src);
            }
            catch (err) {
                if (Parser.LOG_LEVEL > 1)
                    console.error("processed file: " + fileName + " error: " + err);
                throw err;
            }
        });
    }
    /**
     * Load the type mappings from the config file
     */
    loadTypeMappings() {
        const content = fs.readFileSync("type_mapping.json", "UTF-8");
        this.typeMappings = JSON.parse(content);
    }
    /**
     * Load the type mappings from the config file
     */
    loadFileNames() {
        const content = fs.readFileSync("files.txt", "UTF-8");
        this.fileNames = content.split("\n");
    }
    /**
     * Load a single API file
     */
    loadAPIFile(name) {
        if (Parser.LOG_LEVEL > 3)
            console.info("Parsing API file" + name);
        const fileName = path.join(Parser.BASE_DIR, name);
        const content = fs.readFileSync(fileName, "UTF-8");
        const result = JSON.parse(content, (k, v) => {
            if (typeof v !== 'object')
                return v;
            if (['members', 'properties', 'statics'].indexOf(k) < 0)
                return v;
            let m = new Map();
            for (k in v)
                m.set(k, v[k]);
            return m;
        });
        return result;
        return JSON.parse(content);
    }
    /**
     * Write some util declarations out that will help with the rest
     */
    writeBase() {
        const content = fs.readFileSync("base_declaration.txt", "UTF-8");
        write(content);
    }
    /**
     * Check if q qx type is yet unknown and add it then to the
     * file list to be parsed. This way dependencies are resolved
     * and added to the declaration file.
     *
     */
    addIfNewDependency(t) {
        if (!t)
            return;
        t = t.trim();
        if (t.substring(0, 2) === "qx") {
            const fileName = t + ".json";
            if (files.indexOf(fileName) === -1) {
                files.push(fileName);
                if (Parser.LOG_LEVEL > 3)
                    console.info("adding dependency: " + fileName);
            }
        }
    }
    /**
     * Do the mapping of types from Qooxdoo to TypeScript
     */
    getType(t) {
        const defaultType = "any";
        if (!t)
            return defaultType;
        if (t.indexOf("|") >= 0) {
            return t.split("|").map((v) => this.getType(v)).join("|");
        }
        if (t.endsWith("[]")) {
            return this.getType(t.substring(0, t.length - 2)) + "[]";
        }
        // Check if we have a mapping for this type
        if (this.typeMappings.hasOwnProperty(t)) {
            const result = this.typeMappings[t];
            this.addIfNewDependency(result);
            return result;
        }
        // Check if we talk about a qx type here
        if (t.substring(0, 2) === "qx") {
            this.addIfNewDependency(t);
            return t;
        }
        // We don't know the type
        if (Parser.LOG_LEVEL > 2)
            console.error("Unknown type: " + t);
        return t;
    }
    /**
     * Write a constructor
     */
    writeConstructor(d) {
        // Don't write empty constructors
        if (!(d.construct && d.construct.jsdoc && d.construct.jsdoc["@param"]))
            return;
        write(indent + "constructor (");
        // We make constructor parameters optional, since meta-data too often incomplete
        this.writeParameters(d.construct.jsdoc, true);
        write(");\n");
    }
    /**
     * Utility function to find the child of a certain type
     */
    findChildByType(t, parent) {
        if (!parent)
            return null;
        if (!parent.children)
            return null;
        let result = null;
        for (let i = 0; i < parent.children.length; i++) {
            const child = parent.children[i];
            if (child.type === t)
                return child;
        }
        if (1 == 1)
            return null;
        parent.children.forEach((c) => {
            if (c.type === t) {
                result = c;
            }
        });
        return result;
    }
    /**
    * Write all the methods of a type
    */
    writeStatics(d, isMixin = false) {
        if (!d.statics)
            return;
        d.statics.forEach((m, name, _) => {
            if (m.type === Types.Method) {
                this.fromProperty = null;
                if (m.fromProperty) {
                    this.fromProperty = m.fromProperty;
                }
                // Is this really a method in a based class
                if (m.overriddenFrom)
                    return;
                // Check if we already processed this method as part of mixin or interface
                if (this.processedMethods[name])
                    return;
                // Seems access when defined is private, protected and internal
                // We all map this to private
                // if ((!m.attributes.access) || (m.attributes.access === "protected")) {
                if (Parser.LOG_LEVEL > 3)
                    console.info("Processing method " + name);
                let modifier = "";
                this.processedMethods[name] = true;
                if (m.access) {
                    if (m.access === "protected")
                        modifier = "protected ";
                    if (m.access === "private")
                        return;
                }
                if (isMixin && (modifier == "protected "))
                    return;
                write(indent + modifier + "static " + name + "(");
                this.writeParameters(m.jsdoc);
                write(")");
                this.writeReturnType(m.jsdoc);
                write("\n");
                // }
            }
        });
    }
    /**
     * Write all the methods of a type
     */
    writeMethods(d, isStatic = false, isMixin = false) {
        if (!d.members)
            return;
        d.members.forEach((m, name, _) => {
            if (m.type === Types.Method) {
                this.fromProperty = null;
                if (m.fromProperty) {
                    this.fromProperty = m.fromProperty;
                }
                // Is this really a method in a based class
                if (m.overriddenFrom)
                    return;
                // Check if we already processed this method as part of mixin or interface
                if (this.processedMethods[name])
                    return;
                // var modifier = "public";
                const staticClause = isStatic ? "static " : "";
                // Seems access when defined is private, protected and internal
                // We all map this to private
                // if ((!m.attributes.access) || (m.attributes.access === "protected")) {
                if (Parser.LOG_LEVEL > 3)
                    console.info("Processing method " + name);
                let modifier = "";
                this.processedMethods[name] = true;
                if (m.access) {
                    if (m.access === "protected")
                        modifier = "protected ";
                    if (m.access === "private")
                        return;
                }
                if (isMixin && (modifier == "protected "))
                    return;
                write(indent + modifier + staticClause + name + "(");
                this.writeParameters(m.jsdoc);
                write(")");
                this.writeReturnType(m.jsdoc);
                write("\n");
                // }
            }
        });
    }
    cleanType(t) {
        let result = t || "  ";
        if (result.indexOf(" ") >= 0)
            result = "any";
        if (result.indexOf("(") >= 0)
            result = "any";
        if (result.endsWith("?null"))
            result = result.replace("\?null", "|null");
        if (result.endsWith("?undefined"))
            result = result.replace("\?undefined", "|undefined");
        if (result.endsWith("?"))
            result = result.replace("\?", "|null");
        return result;
    }
    /**
     * Determine the return type of the method and write it
     */
    writeReturnType(d) {
        let returnType = "void";
        if (d && d["@return"]) {
            let type = d["@return"][0].type;
            if (Array.isArray(type)) {
                returnType = type.map((v) => this.getType(v)).join("|");
            }
            else {
                returnType = this.getType(type);
            }
        }
        write(":" + this.cleanType(returnType) + ";");
    }
    /**
     * Write the specific type of one parameter.
     */
    writeParam(p, forceOptional, index) {
        if (p.paramName == "varargs") {
            forceOptional = true;
            write("..." + p.paramName);
        }
        else {
            write(p.paramName || "param" + index);
            if (p.optional || forceOptional)
                write("?");
        }
        write(":");
        if (Array.isArray(p.type)) {
            let type = this.getType(p.type[0].toString());
            write(type + "| null");
        }
        else {
            let type = this.getType(p.type);
            write(this.cleanType(type));
        }
        if (p.paramName == "varargs")
            write("[]");
        return p.optional || forceOptional;
    }
    /**
     * Write out all the arguments of a method. Once one parameter is optional,
     * the remaining ones are also optional (is a TypeScript requirement)
     */
    writeParameters(d, optional = false) {
        if (d && d["@param"]) {
            let first = true;
            d["@param"].forEach((c, index) => {
                if (!first)
                    write(",");
                else
                    first = false;
                optional = this.writeParam(c, optional, index);
            });
        }
    }
    /**
     * Write all the properties of a class, interface or mixin
     */
    writeProperties(d) {
        if (!d.properties)
            return;
        d.properties.forEach((p) => {
            if ((p.type == Types.Property) && p.check) {
                console.log("Setting property " + p.name + ":" + p.check);
                if (p.check !== "var")
                    this.properties[p.name] = p.check;
            }
            if (1 == 1)
                return;
            if (p.type !== Types.Property)
                return;
            if (p.overriddenFrom)
                return; // property already defined in base class
            if (p.check === "var")
                return; // not a real property. use getter/setter
            if (p.event)
                return; // if there is a event defined, use getter/setter
            if ((!p.check) && (Parser.LOG_LEVEL > 2))
                console.error("No type for attribute " + p.name);
            let modifier = "";
            if (p.access) {
                if (p.access === "private")
                    modifier = "private";
                if (p.access === "protected")
                    modifier = "protected";
            }
            const type = this.getType(p.check);
            write(modifier + " " + p.name + ":" + type + ";\n");
        });
    }
    /**
     * Write the mixin methods and properties, thereby mixin it into a class. This method
     * is used for including methods from both mixins and interfaces
     */
    includeMixin(name) {
        name = name.trim();
        if (!name)
            return;
        this.addIfNewDependency(name);
        const fileName = name.replace(/\./g, "/");
        const d = this.loadAPIFile(fileName + ".json");
        this.writeProperties(d);
        this.writeMethods(d);
    }
    /**
     * Implements used
     */
    writeImplementsClause(a) {
        const interfaces = a.interfaces;
        const mixins = a.mixins;
        if ((!interfaces) && (!mixins)) {
            write(" {\n");
            return;
        }
        // var impl = interfaces.split(",").concat(mixins.split(","));
        if (interfaces.length > 0)
            write(" implements " + interfaces.join(","));
        write(" {\n");
        interfaces.forEach((name) => {
            this.includeMixin(name);
        });
        mixins.forEach((name) => {
            this.includeMixin(name);
        });
    }
    writeExtendsClause(a) {
        let extendsClause = "";
        if (a.superClass && (a.superClass !== "Object")) {
            extendsClause = "extends " + this.getType(a.superClass);
        }
        write(extendsClause);
    }
    writeSingleton(a) {
        if (a.isSingleton)
            write(`static getInstance() : ${a.name} ;\n`);
    }
    /**
     * Write the class or interface declaration
     */
    writeClass(d) {
        let prefix = d.packageName ? d.packageName + "." : "";
        if (Parser.LOG_LEVEL > 2)
            console.info("Processing class " + prefix + d.name);
        if (d.type === "interface") {
            write(`interface ${d.name} `);
        }
        else {
            write(`class ${d.name} `);
        }
        this.writeExtendsClause(d);
        this.writeImplementsClause(d);
        this.writeSingleton(d);
        this.writeProperties(d);
        this.writeConstructor(d);
        this.writeStatics(d);
        this.writeMethods(d);
        write("\n}\n");
    }
    /**
     * Write the module declaration if any.
     */
    writeModule(d) {
        const moduleName = d.packageName;
        if (moduleName) {
            write(`declare module ${moduleName} {\n`);
        }
        else {
            write("declare ");
        }
        this.writeClass(d);
        if (moduleName)
            write("}\n");
    }
}
// Check for missing classes and add those files if required.
Parser.HANDLE_DEPENDENCIES = true;
// Don't put private methods and properties in the declaration
Parser.EXCLUDE_PRIVATE = true;
// The level of logging
Parser.LOG_LEVEL = 3;
// Include Mixins
Parser.HANDLE_MIXINS = true;
// Sometime methods are duplicated. 
Parser.AVOID_DUPLICATES = true;
// Where to find the API documentation json files
Parser.BASE_DIR = "api/";
/****************************************************************************
 Here is where the processing is kicked of, reading the files from the
 command arguments and start parsing them.
 *****************************************************************************/
const files = process.argv.slice(2);
const parser = new Parser();
parser.run();
fs.writeFileSync("qooxdoo.d.ts", output);
