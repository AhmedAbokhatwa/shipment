import frappe
from frappe.model.document import Document
from frappe.utils import flt
from frappe.model.mapper import get_mapped_doc

class PurchaseOrderShipment(Document):
    pass

@frappe.whitelist()
def make_purchase_order_shipment(source_name, target_doc=None):
    print("Source Name:", source_name)
    print("Target Doc:", target_doc)

    # Define the function to update item fields during mapping
    def update_item(obj, target, source_parent):
        print("===================my obj",target)
        target.qty = flt(obj.qty) - flt(obj.received_qty)
        target.stock_qty = (flt(obj.qty) - flt(obj.received_qty)) * flt(obj.conversion_factor)
        target.amount = flt(target.qty) * flt(obj.rate)

        # target.base_amount = (
        #     (flt(obj.qty) - flt(obj.received_qty)) * flt(obj.rate) * flt(source_parent.conversion_rate)
        # )

    # Define field mapping for Purchase Order to Purchase Order Shipment
    field_mappings = {
        "Purchase Order": {
            "doctype": "Purchase Order Shipment",
            "field_map": {"supplier_warehouse": "supplier_warehouse"},
            "validation": {"docstatus": ["=", 1]},
        },
        "Purchase Order Item": {
            "doctype": "Shipment Order Details",
            "field_map": {
                "name": "custom_shipment_orders",
                "parent": "purchase_order",
                "bom": "bom",
                "material_request": "material_request",
                "material_request_item": "material_request_item",
                "sales_order": "sales_order",
                "sales_order_item": "sales_order_item",
                "wip_composite_asset": "wip_composite_asset",
            },
            "postprocess": update_item,
            "condition": lambda d: d.received_qty < d.qty,
        }
    }

    # Map the document, inserting data into target_doc if it exists
    doc = get_mapped_doc(
        "Purchase Order",
        source_name,
        field_mappings,
        target_doc=target_doc or frappe.new_doc("Purchase Order Shipment")  # Use target_doc if provided, else create new
    )

    # Save the mapped document only if it's a new one (not when target_doc was provided)
    if not target_doc:
        doc.insert(ignore_permissions=True)
        frappe.msgprint(f"Mapped and saved Document: {update_item}")
    else:
        frappe.msgprint(f"Data has been updated in the current document.{update_item}")

    return doc

@frappe.whitelist()
def get_shipment_qty_for_po(po_number):
    sql = """
        SELECT 
            SUM(custom_add) AS custom_shipment_qty,
            po_number AS po,
            item_code
        FROM
            `tabShipment Order Details`
        WHERE 
            po_number = %s
        GROUP BY item_code
    """
    data = frappe.db.sql(sql, po_number, as_dict=True)

    for po in data:
        po_doc = frappe.get_doc('Purchase Order', po.po)
        po_doc.flags.ignore_validate_update_after_submit = True
        po_doc.flags.ignore_validate = True
        po_doc.flags.ignore_mandatory = True

        item_found = False
        for r in po_doc.items:
            if r.item_code == po.item_code:
                r.custom_shipment_qty = po.custom_shipment_qty  
                item_found = True
                break

        if item_found:
            po_doc.save()
            frappe.db.commit()
            frappe.msgprint(f"{po_doc.name} is updated with custom shipment qty {po.custom_shipment_qty} for item {po.item_code}")
        else:
            frappe.msgprint(f"No item with item code {po.item_code} found in Purchase Order {po_doc.name}")
