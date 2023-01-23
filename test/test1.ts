/**
 * Some source code to check if the declaration file is ok.
 */ 

function createRandomRows(rowCount) {
  var rowData: any[] = [];
  var now = new Date().getTime();
  var dateRange = 400 * 24 * 60 * 60 * 1000; // 400 days
  var nextId = 0;
  for (var row = 0; row < rowCount; row++) {
    var date = new Date(now + Math.random() * dateRange - dateRange / 2);
    rowData.push([ nextId++, Math.random() * 10000, date, (Math.random() > 0.5) ]);
  }
  return rowData;
}


// window
var win = new qx.ui.window.Window("Table")
win.set({
  layout : new qx.ui.layout.Grow(),
  allowClose: false,
  allowMinimize: false,
  contentPadding: 0
});
this.getRoot().add(win);
win.moveTo(30, 40);
win.open();

// table model
var tableModel = new qx.ui.table.model.Simple();

tableModel.setColumns([ "ID", "A number", "A date", "Boolean" ]);
tableModel.setData(createRandomRows(1000));

// make second column editable
tableModel.setColumnEditable(1, false);

// table
var table = new qx.ui.table.Table(tableModel)
table.set({
  decorator: null
});
win.add(table);

var tcm = table.getTableColumnModel();

// Display a checkbox in column 3
tcm.setDataCellRenderer(3, new qx.ui.table.cellrenderer.Boolean());

// use a different header renderer
tcm.setHeaderCellRenderer(2, new qx.ui.table.headerrenderer.Icon("icon/16/apps/office-calendar.png", "A date"));