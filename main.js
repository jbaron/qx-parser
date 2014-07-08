var fs = require("fs");
var path = require("path");

/**
* The different types referred to in the JSON API file
*/
var Types = (function () {
    function Types() {
    }
    Types.Class = "class";
    Types.Methods = "methods";
    Types.MethodsStatic = "methods-static";
    Types.Method = "method";
    Types.Constructor = "constructor";
    Types.Properties = "properties";
    Types.Property = "property";
    Types.Return = "return";
    Types.Types = "types";
    Types.Entry = "entry";
    Types.Param = "param";
    return Types;
})();



// Open the file descriptor
var fd = fs.openSync("qooxdoo.d.ts", "w", null);

/**
* Write out a piece of the declaration file
*/
function write(msg) {
    var buffer = new Buffer(msg);
    fs.writeSync(fd, new Buffer(msg), 0, buffer.length, null);
    //process.stdout.write(msg);
}

/**
* This class loads the Qooxdoo API files that are passed to the cosntructur
* and generates a declaration file out of that.
*/
var Parser = (function () {
    function Parser() {
        // Contains the mapping from Qooxdoo types to TypeScript types
        this.typeMappings = {};
        this.processedMethods = {};
        this.loadTypeMappings();
        this.loadFileNames();
    }
    Parser.prototype.run = function () {
        var _this = this;
        this.writeBase();

        this.fileNames.forEach(function (fileName) {
            if ((!fileName) || (fileName.indexOf("//") === 0))
                return;
            try  {
                var src = _this.loadAPIFile(fileName);
                _this.writeModule(src);
            } catch (err) {
                if (Parser.LOG_LEVEL > 1)
                    console.error("processed file: " + fileName + " error: " + err);
            }
        });
    };

    /**
    * Load the type mappings from the config file
    */
    Parser.prototype.loadTypeMappings = function () {
        var content = fs.readFileSync("type_mapping.json", "UTF-8");
        this.typeMappings = JSON.parse(content);
    };

    /**
    * Load the type mappings from the config file
    */
    Parser.prototype.loadFileNames = function () {
        var content = fs.readFileSync("files.txt", "UTF-8");
        this.fileNames = content.split("\n");
    };

    /**
    * Load a single API file
    */
    Parser.prototype.loadAPIFile = function (name) {
        if (Parser.LOG_LEVEL > 3)
            console.error("Parsing API file" + name);
        var fileName = path.join(Parser.BASE_DIR, name);
        var content = fs.readFileSync(fileName, "UTF-8");
        var result = JSON.parse(content);
        return result;
    };

    /**
    * Write some util declarations out that will help with the rest
    */
    Parser.prototype.writeBase = function () {
        var content = fs.readFileSync("base_declaration.txt", "UTF-8");
        write(content);
    };

    /**
    * Check if q qx type is yet unknown and add it then to the
    * file list to be parsed. This way dependecies are resolved
    * and added to the declaration file.
    *
    */
    Parser.prototype.checkIfNewDependency = function (t) {
        if (!t)
            return;
        if (t.substring(0, 2) === "qx") {
            var fileName = t + ".json";
            if (files.indexOf(fileName) === -1) {
                files.push(fileName);
                if (Parser.LOG_LEVEL > 2)
                    console.error("adding dependency: " + fileName);
            }
        }
    };

    /**
    * Do the mapping of types from Qooxdoo to TypeScript
    */
    Parser.prototype.getType = function (t, defaultType) {
        if (typeof defaultType === "undefined") { defaultType = "any"; }
        if (!t)
            return defaultType;

        // Check if we have a mpping for this type
        if (this.typeMappings.hasOwnProperty(t)) {
            var result = this.typeMappings[t];
            this.checkIfNewDependency(result);
            return result;
        }

        // Check if we talk about a qx type here
        if (t.substring(0, 2) === "qx") {
            this.checkIfNewDependency(t);
            return t;
        }

        // We don't know the type
        if (Parser.LOG_LEVEL > 2)
            console.error("Unknow type: " + t);
        return defaultType;
    };

    /**
    * Write a constructor
    */
    Parser.prototype.writeConstructor = function (d) {
        var _this = this;
        d.forEach(function (m) {
            if (m.type === Types.Method) {
                write("constructor (");
                _this.writeParameters(m);
                write(");\n");
            }
        });
    };

    /**
    * Utiltiy function to find the child of a a certain type
    */
    Parser.prototype.findChildByType = function (t, parent) {
        if (!parent)
            return null;
        if (!parent.children)
            return null;
        var result = null;
        for (var i = 0; i < parent.children.length; i++) {
            var child = parent.children[i];
            if (child.type === t)
                return child;
        }
        return null;

        parent.children.forEach(function (c) {
            if (c.type === t) {
                result = c;
            }
        });
        return result;
    };

    /**
    * Write all the methods of a type
    */
    Parser.prototype.writeMethods = function (d, isStatic) {
        var _this = this;
        if (typeof isStatic === "undefined") { isStatic = false; }
        d.forEach(function (m) {
            if (m.type === Types.Method) {
                // Is this really a method in a based class
                if (m.attributes.overriddenFrom)
                    return;

                // Check if we already processed this method as part of mixin or interface
                if (_this.processedMethods[m.attributes.name])
                    return;

                var modifier = "public";
                var staticClause = isStatic ? " static " : " ";

                // Seems access when defined is private, protected and internal
                // We all map this to private
                if ((!m.attributes.access) || (m.attributes.access === "protected")) {
                    if (Parser.LOG_LEVEL > 3)
                        console.error("Processing method " + m.attributes.name);

                    _this.processedMethods[m.attributes.name] = true;
                    write(staticClause + m.attributes.name + "(");
                    _this.writeParameters(m);
                    write(")");
                    _this.writeReturnType(m);
                    write("\n");
                }
            }
        });
    };

    /**
    * Determine the return type of a method and write it
    */
    Parser.prototype.writeReturnType = function (d) {
        var returnType = "void";
        var a = this.findChildByType(Types.Return, d);
        a = this.findChildByType(Types.Types, a);
        a = this.findChildByType(Types.Entry, a);
        if (a && a.attributes.type) {
            returnType = this.getType(a.attributes.type);
            if (a.attributes.dimensions)
                returnType += "[]";
        }
        write(":" + returnType + ";");
    };

    /**
    * Write the specific type of one parameter.
    */
    Parser.prototype.writeParam = function (p, forceOptional) {
        var type = "any";
        write(p.attributes.name);
        if (p.attributes.optional || forceOptional)
            write("?");
        write(":");
        var a = this.findChildByType(Types.Types, p);
        a = this.findChildByType(Types.Entry, a);
        if (a && a.attributes.type) {
            type = this.getType(a.attributes.type);
            if (a.attributes.dimensions)
                type += "[]";
        }
        write(type);
        return p.attributes.optional || forceOptional;
    };

    /**
    * Write out all the arguments of a method. Once one paramter is optional,
    * the remaining ones are also optional (is a TypeScript requirement)
    */
    Parser.prototype.writeParameters = function (d) {
        var _this = this;
        var params = this.findChildByType("params", d);
        var first = true;
        var optional = false;
        if (params) {
            params.children.forEach(function (c) {
                if (c.type === Types.Param) {
                    if (!first)
                        write(",");
                    else
                        first = false;
                    optional = _this.writeParam(c, optional);
                }
            });
        }
    };

    /**
    * Write all the properties of a class, interface or mixin
    */
    Parser.prototype.writeProperties = function (d) {
        var _this = this;
        d.forEach(function (p) {
            if (p.type !== Types.Property)
                return;
            if (p.attributes.overriddenFrom)
                return;
            if (p.attributes.check === "var")
                return;
            if (p.attributes.event)
                return;

            if ((!p.attributes.check) && (Parser.LOG_LEVEL > 2))
                console.error("No type for attribute " + p.attributes.name);

            var modifier = "";
            if (p.attributes.access)
                modifier = "private";
            var type = _this.getType(p.attributes.check, "any");
            write(modifier + " " + p.attributes.name + ":" + type + ";\n");
        });
    };

    /**
    * Write the mixin methods and properties, thereby mixin it into a class. This method
    * is used for including methods from both mixins and interfaces
    */
    Parser.prototype.includeMixin = function (fileName) {
        var _this = this;
        var src = this.loadAPIFile(fileName);
        src.children.forEach(function (c) {
            // if (c.type === Types.Constructor) writeConstructor(c.children);
            if (c.type === Types.MethodsStatic)
                _this.writeMethods(c.children, true);
            if (c.type === Types.Methods)
                _this.writeMethods(c.children);
            // if (c.type === Types.Properties) this.writeProperties(c.children);
        });
    };

    /**
    * Write the class or interface declaration
    */
    Parser.prototype.writeClass = function (d) {
        var _this = this;
        var extendsClause = "";

        // Reset the golbal methods list.
        this.processedMethods = {};

        var a = d.attributes;

        if (Parser.LOG_LEVEL > 3)
            console.error("Processing class " + a.name);

        if (a.superClass && (a.superClass !== "Object")) {
            extendsClause = " extends " + this.getType(a.superClass);
        }
        var type = "class ";
        if (a.type === "interface")
            type = "interface ";

        write(type + a.name + extendsClause);

        if (a.interfaces) {
            write(" implements " + a.interfaces + " {\n");
            var i = a.interfaces ? a.interfaces.split(",") : [];
            i.forEach(function (name) {
                _this.checkIfNewDependency(name);
                _this.includeMixin(name + ".json");
            });
        } else {
            write(" {\n");
        }

        this.checkIfNewDependency(a.superClass);
        var mixins = a.mixins ? a.mixins.split(",") : [];
        mixins.forEach(function (name) {
            _this.includeMixin(name + ".json");
        });

        d.children.forEach(function (c) {
            if (c.type === Types.Constructor)
                _this.writeConstructor(c.children);
            if (c.type === Types.MethodsStatic)
                _this.writeMethods(c.children, true);
            if (c.type === Types.Methods)
                _this.writeMethods(c.children);
            if (c.type === Types.Properties)
                _this.writeProperties(c.children);
        });
        write("}\n");
    };

    /**
    * Write the module declaration if any.
    */
    Parser.prototype.writeModule = function (d) {
        var moduleName = d.attributes.packageName;

        if (moduleName) {
            write("declare module " + moduleName + " {\n");
        } else {
            write("declare ");
        }
        this.writeClass(d);

        if (moduleName)
            write("}\n");
    };
    Parser.HANDLE_DEPENDECIES = true;

    Parser.EXCLUDE_PRIVATE = true;

    Parser.LOG_LEVEL = 4;

    Parser.HANLDE_MIXINS = true;

    Parser.AVOID_DUPLICATES = true;

    Parser.BASE_DIR = "api_4.0/";
    return Parser;
})();

/****************************************************************************
Here is where the processing is kicked of, reading the files from the
command arguments and start parsing them.
*****************************************************************************/
var files = process.argv.slice(2);

var parser = new Parser();
parser.run();
