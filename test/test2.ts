/**
 * Create a button
 */ 
function createButton(): qx.ui.container.Composite {
    const button1 = new qx.ui.form.Button("First Button", "icon/22/apps/internet-web-browser.png");
    const button2 = new qx.ui.form.Button("Dark Theme", "icon/22/apps/internet-web-browser.png");
    const button3 = new qx.ui.form.Button("Light Theme", "icon/22/apps/internet-web-browser.png");

    // Add an event listener
    let t: any = qx.theme

    button1.addListener("execute", function(e) { alert("Hello World!"); });
    button2.addListener("execute", function(e) { qx.theme.manager.Meta.getInstance().setTheme(t.TangibleDark) });
    button3.addListener("execute", function(e) { qx.theme.manager.Meta.getInstance().setTheme(t.TangibleLight) });

    let c = new qx.ui.container.Composite(new qx.ui.layout.Flow());
    c.add(button1)
    c.add(button2)
    c.add(button3)

    return c;
}

/**
 * Create a sample form.
 */ 
function createForm(): qx.ui.core.Widget {
    const form = new qx.ui.form.Form();

    // add the first headline
    form.addGroupHeader("Registration");

    // add username
    const userName = new qx.ui.form.TextField();
    userName.setRequired(true);
    form.add(userName, "Name");
    // add password
    const password = new qx.ui.form.PasswordField();
    password.setRequired(true);
    form.add(password, "Password");
    // add a save checkbox
    form.add(new qx.ui.form.CheckBox(), "Save?");

    // add the second header
    form.addGroupHeader("Personal Information");

    // add some additional widgets
    form.add(new qx.ui.form.Spinner(0, 50, 100), "Age");
    form.add(new qx.ui.form.TextField(), "Country");
    const genderBox = new qx.ui.form.SelectBox();
    genderBox.add(new qx.ui.form.ListItem("male"));
    genderBox.add(new qx.ui.form.ListItem("female"));
    form.add(genderBox, "Gender");
    form.add(new qx.ui.form.TextArea(), "Bio");

    // send button with validation
    const sendButton = new qx.ui.form.Button("Send");
    sendButton.addListener("execute", function() {
        if (form.validate()) {
            alert("send...");
        }
    }, this);
    form.addButton(sendButton);

    // reset button
    const resetButton = new qx.ui.form.Button("Reset");
    resetButton.addListener("execute", function() {
        form.reset("");
    }, this);
    form.addButton(resetButton);

    // create the form and return it
    return new qx.ui.form.renderer.Single(form);
}


/**
 * Create some random rows for the table example
 */ 
function createRandomRows2(rowCount:number) {
    const rowData: any[] = [];
    const now = new Date().getTime();
    const dateRange = 400 * 24 * 60 * 60 * 1000; // 400 days
    let nextId = 0;
    for (let row = 0; row < rowCount; row++) {
        const date = new Date(now + Math.random() * dateRange - dateRange / 2);
        rowData.push([nextId++, Math.random() * 10000, date, (Math.random() > 0.5)]);
    }
    return rowData;
}

/**
 * Create an example using the table widget showing some basic
 * funcitonality
 */ 
function createTable(): qx.ui.core.Widget {
    // table model
    const tableModel = new qx.ui.table.model.Simple();

    tableModel.setColumns(["Billing-ID", "Amount", "Date", "Paid"]);
    tableModel.setData(createRandomRows2(100));

    // make second column editable
    tableModel.setColumnEditable(1, true);

    // table
    const table = new qx.ui.table.Table(tableModel);
    table.set({
        decorator: null
    });

    const tcm = table.getTableColumnModel();

    // Display a checkbox in column 3
    const renderer = new qx.ui.table.cellrenderer.Boolean() // as any as qx.ui.table.ICellRenderer
    tcm.setDataCellRenderer(3, renderer);

    return table;
}

/**
 * Create a sample tree
 */ 
function createTree(): qx.ui.core.Widget {
    // create the tree
    const tree = new qx.ui.tree.Tree();
    tree.set({ width: 150, height: 300 });

    // create and set the tree root
    const root = new qx.ui.tree.TreeFolder("Desktop");
    tree.setRoot(root);

    // create some subitems
    const f1 = new qx.ui.tree.TreeFolder("Logos");
    const f2 = new qx.ui.tree.TreeFolder("TODO");
    const f3 = new qx.ui.tree.TreeFile("jsmag_js9.pdf");
    f3.setIcon("icon/22/mimetypes/text-html.png");
    root.add(f1, f2, f3);

    // create a third layer
    const f11 = new qx.ui.tree.TreeFile("Logo1.png");
    f11.setIcon("icon/22/mimetypes/media-image.png");
    const f12 = new qx.ui.tree.TreeFile("Logo2.png");
    f12.setIcon("icon/22/mimetypes/media-image.png");
    const f13 = new qx.ui.tree.TreeFile("Logo3.png");
    f13.setIcon("icon/22/mimetypes/media-image.png");
    f1.add(f11, f12, f13);

    // open the folders
    root.setOpen(true);
    f1.setOpen(true);
    return tree;
}


/**
 * Simple class extension example
 */ 
class MyPage extends qx.ui.tabview.Page {
    constructor(name: string) {
        super(name);
        this.setLayout(new qx.ui.layout.Flow());
        this.setShowCloseButton(true);
    }
    
}

/**
 * This is the main function that will be called from the qooxdoo application
 * to start everything.
 */ 
function qooxdooMain(app: qx.application.Standalone) {
    const demo: Function[] = [createButton, createTable, createTree, createForm];

    // Document is the application root container
    const doc = <qx.ui.container.Composite>app.getRoot();

    // Lets create the container for the tabs
    const t = new qx.ui.tabview.TabView("left");

    //And now lets add some tabs
    for (let x = 0; x < demo.length; x++) {
        const p = new MyPage((<any>demo[x]).name);
        p.add(demo[x]());
        t.add(p);
    }

    doc.add(t,{ edge: 0});

}

qx.registry.registerMainMethod(qooxdooMain);
