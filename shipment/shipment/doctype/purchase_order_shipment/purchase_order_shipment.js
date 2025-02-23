frappe.provide("erpnext.buying");

// Ensure the parent class exists before extending
if (typeof erpnext.buying.PurchaseOrderController !== "undefined") {
    erpnext.buying.PurchaseOrderController = class ShipmentOrderController extends erpnext.buying.PurchaseOrderController {
        setup() {
            frm.custom_make_buttons = {
                "Purchase Receipt": "Purchase Receipt",
                "Purchase Invoice": "Purchase Invoice",
                "Payment Entry": "Payment",
                "Subcontracting Order": "Subcontracting Order",
                "Stock Entry": "Material to Supplier",
            };

            super.setup();
        }

        make_purchase_invoice() {
            frappe.model.open_mapped_doc({
                method: "erpnext.buying.doctype.purchase_order.purchase_order.make_purchase_invoice",
                frm: cur_frm
            });
        }
    };
} else {
    console.error("PurchaseOrderController is not defined!");
}

////////////////////////////////////////////
frappe.ui.form.on("Purchase Order Shipment", {
    refresh(frm) {
        // Add custom buttons and any additional UI setup
        frm.events.add_custom_buttons(frm)
        // frm.events.add_custom_busttons(frm);
        frm.trigger('make_purchase_invoice'); 
    },
    make_purchase_invoice(frm) {
      // Trigger the method from the extended controller
      frappe.model.open_mapped_doc({
          method: "erpnext.buying.doctype.purchase_order.purchase_order.make_purchase_invoice",
          frm: frm
      });
  },
    add_custom: function(frm) {
        // Call close_purchase_receipt directly without instantiation
        erpnext.stock.close_purchase_receipt(frm);
    },

    add_custom_but: function(frm) {
      if (frm.doc.docstatus == 1 && frm.doc.status != "Closed") {
				
			}
    },
  add_custom_buttons: function (frm) {
    // if (frm.doc.docstatus == 1 && frm.doc.status != "Closed") {
		// if (frm.doc.docstatus == 0) {
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
            target_doc:frm,
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
		// }
  // }
	},
  update_status: function (frm, status) {
    frappe.ui.form.is_saving = true;
    frappe.call({
        method: "erpnext.stock.doctype.purchase_receipt.purchase_receipt.update_purchase_receipt_status",
        args: { docname: frm.doc.name, status: status },
        callback: function (r) {
            if (!r.exc) frm.reload_doc();
        },
        always: function () {
            frappe.ui.form.is_saving = false;
        },
    });
}


});


  frappe.ui.form.on("Purchase Order Shipment", {
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
    
    
    },
    
  });  
frappe.ui.form.on('Shipment Order Details', {
	custom_add(frm,cdt,cdn) {
		// your code here
    var row = locals[cdt][cdn]
    frappe.model.set_value(cdt, cdn, "custom_shipment_qty", (row.custom_shipment_qty + row.custom_add));
	},

})

