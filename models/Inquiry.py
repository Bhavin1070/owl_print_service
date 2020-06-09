# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import uuid
from odoo import models, fields


class Inquiry(models.Model):
    _inherit = 'crm.lead'

    def _default_order_reference(self):
        return str(uuid.uuid4())

    order_reference = fields.Char(default=_default_order_reference, store=True)
    product_id = fields.Many2one('product.template', required=True)
    product_name = fields.Char(string='Service Name', required=True)
    email_to = fields.Char(string="User Email", tracking=40, index=True, required=True)
    attachment = fields.Binary(string="Attachment")
    state = fields.Selection([('pending', 'Pending'), ('accept', 'Acccepted'), ('reject', 'Rejected')], string="Status", default="pending")
