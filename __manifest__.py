# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'Print Service',
    'summary': 'This is a Print service Application',
    'description': 'This Application Provide online printing and couriar services',
    'author': 'Bhavin Patel',
    'depends': ['portal', 'crm', 'sale_management', 'rating'],
    'data': [
        'security/security.xml',
        # 'security/ir.model.access.csv',
        'data/data.xml',
        'demo/service.xml',
        'demo/inquiry.xml',
        'demo/order.xml',
        'views/portal_user_views.xml',
        'views/web_templates.xml'
    ],
    'demo': [
    ],
    'application': True
}
