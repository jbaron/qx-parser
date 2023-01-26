import * as path from "path";
import * as fs from "fs";

/**
 * The different types referred to in the JSON API file
 */
class Types {
    static Class = "class";
    static Methods = "methods";
    static MethodsStatic = "methods-static";
    static Method = "function";
    static Constructor = "constructor";
    static Properties = "properties"
    static Property = "property";
    static Return = "return";
    static Types = "types";
    static Entry = "entry";
    static Param = "param";
}


interface Member {
    type: string,
    access: string,
    overriddenFrom: string,
    fromProperty : string,
    inherited: boolean,
    jsdoc?: JSDoc
}

interface Param {
    paramName: string,
    type: string | Array<string>,
    optional?: boolean,
}

interface Return {
    type: string | Array<string>,
}

interface JSDoc {
    "@param"? : Array<Param>,
    "@return"? : Array<Return>
}

interface Construct {
    jsdoc: JSDoc
}

interface Property {
    name: string;
    check: string;
    nullable: boolean;
    type: Types;
    event?: string;
    access?: string;
    overriddenFrom?: string;
}




/**
 * This is the format of the Qooxdoo JSON API file.
 */
interface API {
    packageName?: string;
    name?: string;
    fromProperty?: string;
    access?: string;
    check?: string;
    allowNull?: string;
    superClass?: string;
    isSingleton?: boolean;
    type?: string;
    overriddenFrom?: string;
    mixins: Array<string>;
    event?: string;
    dimensions?: number;
    optional?: boolean;
    interfaces: Array<string>;
    docFrom?: string;
    children: Array<API>;
    properties?: Map<string, Property>;
    construct?: Construct;
    members?: Map<string, Member>;
    statics?:  Map<string, Member>;
    aliases?: any;
}

enum ClassType {
    "interface",
    "class"
}

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

    // Check for missing classes and add those files if required.
    static HANDLE_DEPENDENCIES = true;

    // Don't put private methods and properties in the declaration
    static EXCLUDE_PRIVATE = true;

    // The level of logging
    static LOG_LEVEL = 3;

    // Include Mixins
    static HANDLE_MIXINS = true;

    // Sometime methods are duplicated. 
    static AVOID_DUPLICATES = true;

    // Where to find the API documentation json files
    static BASE_DIR = "api/";

    // Contains the mapping from Qooxdoo types to TypeScript types
    private typeMappings: Map<string, string>;

     // Contains the mapping from methods names to full tyepscripe declarions
     private methodMappings: Map<string, string>;

    private fileNames: string[];

    private processedMethods = {};

    private properties = {};

    private fromProperty: string = null;

    constructor() {
        this.loadTypeMappings();
        this.loadMethodMappings();
        this.loadFileNames();
    }

    public run() {
        this.writeBase();

        this.fileNames.forEach((fileName) => {
            if ((!fileName) || (fileName.indexOf("//") === 0)) return;
            try {
                const src: API = this.loadAPIFile(fileName);

                // Reset the global methods list.
                this.processedMethods = {};
                this.properties = {};

                this.writeModule(src);
            } catch (err) {
                if (Parser.LOG_LEVEL > 1) console.error("processed file: " + fileName + " error: " + err);
                throw err
            }
        });
    }

    /**
     * Load the type mappings from the config file
     */
    private loadTypeMappings() {
        const content = fs.readFileSync("type_mapping.json", "UTF-8");
        this.typeMappings = JSON.parse(content);
    }

      /**
     * Load the type mappings from the config file
     */
      private loadMethodMappings() {
        const content = fs.readFileSync("method_mapping.json", "UTF-8");
        this.methodMappings = JSON.parse(content);
    }

    /**
     * Load the type mappings from the config file
     */
    private loadFileNames() {
        const content = fs.readFileSync("files.txt", "UTF-8");
        this.fileNames = content.split("\n");
    }


    /**
     * Load a single API file
     */
    private loadAPIFile(name): API {
        if (Parser.LOG_LEVEL > 3) console.info("Parsing API file" + name);
        const fileName = path.join(Parser.BASE_DIR, name);
        const content = fs.readFileSync(fileName, "UTF-8");
        const result = JSON.parse(content, (k,v) => {
            if(typeof v !== 'object') return v;    
            if (['members','properties','statics'].indexOf(k) < 0 ) return v;
            let m = new Map();
            for(k in v) m.set(k, v[k]);
            return m;
        });
        return result
        return JSON.parse(content);
    }

    /**
     * Write some util declarations out that will help with the rest
     */
    private writeBase() {
        const content = fs.readFileSync("base_declaration.txt", "UTF-8");
        write(content);
    }


    /**
     * Check if q qx type is yet unknown and add it then to the
     * file list to be parsed. This way dependencies are resolved
     * and added to the declaration file.
     */
    private addIfNewDependency(t: string) {
        if (!t) return;
        t = t.trim();
        if (t.substring(0, 2) === "qx") {
            const fileName = t + ".json";
            if (files.indexOf(fileName) === -1) {
                files.push(fileName);
                if (Parser.LOG_LEVEL > 3) console.info("adding dependency: " + fileName);
            }
        }
    }



    private getTypeObject(t: any) : string {
        let result = this.getTypeString(t.type)
        if (t.dimensions) result += []
        return result

    }

    private getType(t: any) : string {

        if (t === undefined) return "any"
       
        if (Array.isArray(t)) {
            const result = t.map((value) => this.getType(value)).join("|")
            return result    
        }

        if (typeof t === 'string') return this.getTypeString(t)

        // it is an object
        return this.getTypeObject(t)

    }


    /**
     * Do the mapping of types from Qooxdoo to TypeScript
     */
    private getTypeString(t: string) : string {
        const defaultType = "any";
        if (!t) return defaultType;

        if (t.indexOf("|") >= 0) {
            return t.split("|").map( (v) => this.getTypeString(v)).join("|")
        }

        if (t.endsWith("[]")) {
            return this.getTypeString(t.substring(0, t.length - 2 )) + "[]"
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
        if (Parser.LOG_LEVEL > 2) console.error("Unknown type: " + t);
        return t;
    }


    /**
     * Write a constructor
     */
    writeConstructor(d: API) {
        // Don't write empty constructors
        if (! (d.construct && d.construct.jsdoc && d.construct.jsdoc["@param"])) return

        write(indent + "constructor (");

        // We make constructor parameters optional, since meta-data too often incomplete
        this.writeParameters(d.construct.jsdoc, true);
        write(");\n");
    }

       /**
        * Write any aliases properties
        */
       writeAliases(d: API) {
        if (! d.aliases) return
        write(indent + "static aliases: any;\n");
    }

    /**
     * Utility function to find the child of a certain type
     */
    findChildByType(t: string, parent: API): API {
        if (!parent) return null;
        if (!parent.children) return null;
        let result = null;
        for (let i = 0; i < parent.children.length; i++) {
            const child = parent.children[i];
            if (child.type === t) return child
        }
        if (1 == 1) return null;

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
      writeStatics(d: API, isMixin = false) {
        if (! d.statics) return
        d.statics.forEach((m, name, _) => {
            if (m.type === Types.Method) {
                this.fromProperty = null;
                if (m.fromProperty) {
                    this.fromProperty = m.fromProperty
                }

                // Is this really a method in a based class
                if (m.overriddenFrom) return;

                // Check if we already processed this method as part of mixin or interface
                if (this.processedMethods[name]) return;

            
                // Seems access when defined is private, protected and internal
                // We all map this to private
                // if ((!m.attributes.access) || (m.attributes.access === "protected")) {

                if (Parser.LOG_LEVEL > 3) console.info("Processing method " + name);

                let modifier = "";
                this.processedMethods[name] = true;

                if (m.access) {
                    if (m.access === "protected") modifier = "protected ";
                    if (m.access === "private") return;
                }

                if (isMixin && (modifier == "protected ")) return;

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
    writeMethods(d: API, isStatic = false, isMixin = false) {
        if (! d.members) return
        d.members.forEach((m, name, _) => {
            if (m.type === Types.Method) {
                this.fromProperty = null;
                if (m.fromProperty) {
                    this.fromProperty = m.fromProperty
                }

                // Is this really a method in a based class
                if (m.overriddenFrom) return;
                if (m.inherited) return;

                // Check if we already processed this method as part of mixin or interface
                if (this.processedMethods[name]) return;


                // var modifier = "public";
                const staticClause = isStatic ? "static " : "";

                // Seems access when defined is private, protected and internal
                // We all map this to private
                // if ((!m.attributes.access) || (m.attributes.access === "protected")) {

                if (Parser.LOG_LEVEL > 3) console.info("Processing method " + name);

                let modifier = "";
                this.processedMethods[name] = true;

                if (m.access) {
                    if (m.access === "protected") modifier = "protected ";
                    if (m.access === "private") return;
                }

                if (isMixin && (modifier == "protected ")) return;

                if (this.methodMappings[name]) {
                    write(indent + this.methodMappings[name] + ";\n")
                    return
                }    

                write(indent + modifier + staticClause + name + "(");
                this.writeParameters(m.jsdoc);
                write(")");
                this.writeReturnType(m.jsdoc);
                write("\n");
                // }
            }
        });
    }


    cleanType(t: string) : string {
        let result = t || "  "
        if (result.indexOf(" ") >= 0) result = "any"
        if (result.indexOf("(") >= 0) result = "any"
        if (result.endsWith("?null")) result = result.replace("\?null", "|null")
        if (result.endsWith("?undefined")) result = result.replace("\?undefined", "|undefined")
        if (result.endsWith("?")) result = result.replace("\?", "|null")
        return result
    }

    /**
     * Determine the return type of the method and write it
     */
    writeReturnType(d: JSDoc) {    
        let returnType = "void";
        if (d && d["@return"]) {
            let type = d["@return"][0].type
            returnType = this.getType(type)
        }
        write(":" + this.cleanType(returnType) + ";");
    }

    /**
     * Write the specific type of one parameter.
     */
    writeParam(p: Param, forceOptional: boolean, index: Number): boolean {
        if (p.paramName == "varargs") {
            forceOptional = true;
            write("..." + p.paramName);
        } else {    
            write(p.paramName || "param" + index);
            if (p.optional || forceOptional) write("?");
        }
        write(":");
        let type = this.getType(p.type)
        write(this.cleanType(type));
        
        if (p.paramName == "varargs") write("[]");
        return p.optional || forceOptional;
    }

    /**
     * Write out all the arguments of a method. Once one parameter is optional,
     * the remaining ones are also optional (is a TypeScript requirement)
     */
    writeParameters(d: JSDoc, optional = false) {
        if (d && d["@param"]) {
            let first = true;
            d["@param"].forEach((c, index) => {
                if (!first) write(","); else first = false;
                optional = this.writeParam(c, optional, index);
            });
        }
    }

    /**
     * Write all the properties of a class, interface or mixin
     */
    writeProperties(d: API) {
        if (! d.properties) return
        d.properties.forEach((p) => {

            if ((p.type == Types.Property) && p.check) {
                console.log("Setting property " + p.name + ":" + p.check);
                if (p.check !== "var") this.properties[p.name] = p.check;
            }
            if (1 == 1) return;

            if (p.type !== Types.Property) return;
            if (p.overriddenFrom) return; // property already defined in base class
            if (p.check === "var") return; // not a real property. use getter/setter
            if (p.event) return;  // if there is a event defined, use getter/setter

            if ((!p.check) && (Parser.LOG_LEVEL > 2)) console.error("No type for attribute " + p.name);

            let modifier = "";
            if (p.access) {
                if (p.access === "private") modifier = "private";
                if (p.access === "protected") modifier = "protected";
            }
            const type = this.getTypeString(p.check);
            write(modifier + " " + p.name + ":" + type + ";\n");
        });
    }

    /**
     * Write the mixin methods and properties, thereby mixin it into a class. This method
     * is used for including methods from both mixins and interfaces
     */
    includeMixin(name: string) {
        name = name.trim();
        if (!name) return;
        this.addIfNewDependency(name);

        const fileName = name.replace(/\./g, "/")

        const d: API = this.loadAPIFile(fileName + ".json");
        this.writeProperties(d);
        this.writeMethods(d);
    }

    /**
     * Implements used
     */
    writeImplementsClause(a: API) {
        const interfaces = a.interfaces;
        const mixins = a.mixins;

        if ((!interfaces) && (!mixins)) {
            write(" {\n");
            return;
        }

        // var impl = interfaces.split(",").concat(mixins.split(","));

        if (interfaces.length > 0) write(" implements " + interfaces.join(","));
        write(" {\n");


        interfaces.forEach((name) => {
            this.includeMixin(name);
        });


        mixins.forEach((name) => {
            this.includeMixin(name);
        });
    }

    writeExtendsClause(a: API) {
        let extendsClause = "";

        if (a.superClass && (a.superClass !== "Object")) {
            extendsClause = "extends " + this.getTypeString(a.superClass);
        }
        write(extendsClause);
    }


    writeSingleton(a: API) {
        if (a.isSingleton) 
            write(`static getInstance() : ${a.name} ;\n`)
    }

    /**
     * Write the class or interface declaration
     */
    writeClass(d: API) {

        let prefix = d.packageName ? d.packageName + "." : ""
        if (Parser.LOG_LEVEL > 2) console.info("Processing class " + prefix + d.name);

        if (d.type === "interface") {
            write(`interface ${d.name} `);
        } else {
            write(`class ${d.name} `);
        }

        this.writeExtendsClause(d);
        this.writeImplementsClause(d);
        this.writeSingleton(d);
        this.writeAliases(d);
        this.writeProperties(d);
        this.writeConstructor(d);
        this.writeStatics(d);
        this.writeMethods(d);
        write("\n}\n");
    }


    /**
     * Write the module declaration if any.
     */
    writeModule(d: API) {
        const moduleName = d.packageName;

        if (moduleName) {
            write(`declare module ${moduleName} {\n`);
        } else {
            write("declare ");
        }
        this.writeClass(d);

        if (moduleName) write("}\n");
    }

}

/****************************************************************************
 Here is where the processing is kicked of, reading the files from the
 command arguments and start parsing them.
 *****************************************************************************/

const files = process.argv.slice(2);
const parser = new Parser();
parser.run();
fs.writeFileSync("qooxdoo.d.ts", output);


