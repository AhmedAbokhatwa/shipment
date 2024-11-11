// Copyright (c) 2024, Ahmed Reda Abukhatw and contributors
// For license information, please see license.txt

frappe.ui.form.on("Purchase Order Shipment", {
	refresh(frm) {
    frm.events.add_custom_buttons(frm);
    console.log("opts",obj,source_doc)
	},

  add_custom_buttons: function (frm) {
		if (frm.doc.docstatus == 0) {
      frm.add_custom_button(
        __("Purchase Order"),
        function () {
          if (!frm.doc.supplier) {
            frappe.throw({
              title: __("Mandatory"),
              message: __("Please Select a Supplier"),
            });
          }
          erpnext.utils.map_current_doc({
            method: "shipment.shipment.doctype.purchase_order_shipment.purchase_order_shipment.make_purchase_order_shipment",
            source_doctype: "Purchase Order",
            target: frm.doc,
            setters: {
              supplier: frm.doc.supplier,
              schedule_date: undefined,
            },
            get_query_filters: {
              docstatus: 1,
              status: ["not in", ["Closed", "On Hold"]],
              per_received: ["<", 99.99],
              company: frm.doc.company,
            },
          });
        },
        __("Get Items From")
      );
		}
	},

  on_submit(frm){

      var table = cur_frm.doc.custom_shipment_orders;
      for (let row of table){
          let po_number = row.po_number
          console.log(po_number)

          frm.call({
            method: "get_shipment_qty_for_po",
            args: {
              'po_number':po_number
            },
            callback: (r) => {
              console.log("done it ",r.message)
            }
          })
  
      }
  
  
  }
});
frappe.ui.form.on('Shipment Order Details', {
	custom_add(frm,cdt,cdn) {
		// your code here
    var row = locals[cdt][cdn]
    frappe.model.set_value(cdt, cdn, "custom_shipment_qty", (row.custom_shipment_qty + row.custom_add));
	}
})

