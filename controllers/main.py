# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import base64
from . import checksum
import json
from odoo import http
from odoo.http import request
from odoo.addons.web.controllers.main import Home
from werkzeug import urls


class Home(Home):

    def _login_redirect(self, uid, redirect=None):
        if request.session.uid and request.env['res.users'].sudo().browse(request.session.uid).has_group('print_service.print_service_group_service_providers'):
            return '/home'
        if request.session.uid and request.env['res.users'].sudo().browse(request.session.uid).has_group('base.group_portal'):
            return '/home'
        return super(Home, self)._login_redirect(uid, redirect=redirect)


class PrintServiceUser(http.Controller):

    @http.route('/test', auth='user', type="http", methods=['POST'], csrf=False)
    def test(self, **post):
        print('\n\n', post)
        print('\n\n', post.get('attachment'))
        print('\n\n', type(post.get('attachment')))
        # request.env['product.product'].sudo().create({
        #     'default_code': 'TEST001',
        #     'name': 'Test',
        #     'type': 'consu',
        #     'weight': 0.1,
        #     'list_price': 10,
        #     'description': 'Test',
        #     'image_1920': base64.b64encode(img.read())
        # })
        return

    @http.route('/print/service/getUserType', auth='user', type="json")
    def _getUserType(self):
        return self.getUserType()

    def getUserType(self):
        userType = None
        if request.session.uid and request.env['res.users'].sudo().browse(request.session.uid).has_group('print_service.print_service_group_service_providers'):
            userType = "service_provider"
        elif request.session.uid and request.env['res.users'].sudo().browse(request.session.uid).has_group('base.group_portal'):
            userType = "user"
        else:
            userType = None
        return userType

    @http.route('/home', auth='user', type="http")
    def index(self):
        userType = self.getUserType()
        return request.render("print_service.main_template", {'userType': userType})

    @http.route('/print/service/create/inquiry', auth='user', type="http", methods=['POST'], csrf=False)
    def createInquiry(self, **kw):
        if kw:
            user = request.env['res.users'].sudo().browse([request.session.uid])
            product = request.env['product.template'].sudo().browse([int(kw.get('product_id'))])
            company_user = request.env['res.users'].sudo().browse([product.create_uid.id])
            partner = request.env['res.partner'].sudo().browse([company_user.partner_id.id])
            if user and product and company_user and partner:
                request.env['crm.lead'].sudo().create({
                    'product_id': product.id,
                    'product_name': product.name,
                    'email_to': user.login,
                    'user_id': partner.id,
                    'name': kw.get('name'),
                    'description': kw.get('description'),
                    'attachment': base64.b64encode(kw.get('attachment').read()),
                    'street': kw.get('street'),
                    'street2': kw.get('street2'),
                    'city': kw.get('city'),
                    'zip': kw.get('zip'),
                    'country_id': int(kw.get('country_id')),
                    'company_id': company_user.company_id.id,
                    'partner_id': user.id,
                    'contact_name': partner.name,
                    'partner_name': partner.name,
                    'function': partner.function,
                    'email_from': partner.email,
                    'phone': partner.phone,
                    'mobile': partner.mobile,
                    'website': partner.website,
                })
        return http.local_redirect("/home")

    @http.route('/get_inquiry_data', type='json', auth="user", csrf=False)
    def get_inquiries(self):
        userType = self.getUserType()
        results = request.env['crm.lead'].sudo().search(
            [('create_uid', '=', request.session.uid)])
        if userType == "service_provider":
            user = request.env['res.users'].sudo().browse(
                [request.session.uid])
            results = request.env['crm.lead'].sudo().search(
                [('company_id', '=', user.company_id.id)])
        mylist = ['id', 'name', 'email_to', 'product_id', 'product_name', 'partner_name',
                  'planned_revenue', 'state', 'street', 'street2', 'city', 'zip', 'country_id', 'attachment']
        results.read(mylist)
        product_price = {}
        for inquiry in results:
            product_price[inquiry.id] = inquiry.product_id.list_price
        return {"results": results.read(mylist), 'product_price': product_price, 'userType': userType}

    @http.route('/print/service/accept/inquiry', auth='user', type="json")
    def acceptInquiry(self, inquiry_id=None, amount=None):
        if inquiry_id and amount:
            request.env['crm.lead'].sudo().browse([int(inquiry_id)]).write({
                'state': 'accept',
                'planned_revenue': amount
            })
        return

    @http.route('/print/service/reject/inquiry', auth='user', type="json")
    def rejectInquiry(self, inquiry_id=None):
        if inquiry_id:
            request.env['crm.lead'].sudo().browse([int(inquiry_id)]).write({
                'state': 'reject'
            })
        return

    @http.route('/print/service/cancel/inquiry', auth='user', type="json")
    def cancelInquiry(self, inquiry_id=None):
        if inquiry_id:
            request.env['crm.lead'].sudo().browse([int(inquiry_id)]).write({
                'active': False
            })
        return

    @http.route('/print/service/inquiry/payment', auth='user', type="http")
    def inquiryPayment(self, **kw):
        if kw:
            inquiry = request.env['crm.lead'].sudo().search([('order_reference', '=', kw.get('ORDERID'))], limit=1)
            print('\n\n', inquiry)
            sale = request.env['sale.order'].sudo().create({
                'user_id': inquiry.user_id.id,
                'partner_id': inquiry.partner_id.id,
                'company_id': inquiry.company_id.id,
            })
            request.env['sale.order.line'].sudo().create({
                'order_id': sale.id,
                'inquiry_id': inquiry.id,
                'product_id': inquiry.product_id.id,
                'product_uom': 1,
                'name': inquiry.product_id.name,
                'order_partner_id': request.env.user.partner_id.id,
                'price_unit': int(inquiry.planned_revenue),
                'price_subtotal': int(inquiry.planned_revenue),
                'price_total': int(inquiry.planned_revenue),
                'company_id': inquiry.company_id.id,
            })
            inquiry.write({'active': False})
        return http.local_redirect("/home")

    @http.route('/print/service/change/order/state', auth='user', type="json")
    def changeOrderState(self, **kw):
        print('\n\n', kw)
        request.env['sale.order'].sudo().browse([int(kw.get('order_id'))]).write({'state': kw.get('state')})
        return

    @http.route('/print/service/get/order', auth='user', type="json")
    def getOrder(self):
        userType = self.getUserType()
        domain = []
        if userType == 'user':
            domain = [('create_uid', '=', request.session.uid)]
        elif userType == 'service_provider':
            domain = [('user_id', '=', request.env.user.partner_id.id)]
        order = request.env['sale.order'].sudo().search(domain)
        order_detail = order.order_line.read(['id', 'name', 'price_unit', 'price_tax', 'price_total', 'product_uom_qty', 'product_id', 'order_id'])
        products = {}
        sales = {}
        order_id = {}
        company_name = {}
        partner = {}
        for line in order.order_line:
            products[line.id] = line.product_id.image_1920
            sales[line.id] = line.order_id.state
            order_id[line.id] = line.order_id.id
            company_name[line.id] = line.company_id.name
            partner[line.id] = line.order_id.partner_id.id
        return {'details': order_detail, 'products': products, 'sales': sales, 'order_id': order_id, 'company_name': company_name, 'partner': partner, 'userType': userType}

    @http.route('/get_product_data', type='json', auth="user", csrf=False)
    def get_product(self, offset=0, limit=0, order=None, product=None):
        userType = self.getUserType()
        request.env.cr.execute("""SELECT count(*) FROM product_template;""")
        if userType == "service_provider":
            request.env.cr.execute(
                "SELECT count(*) FROM product_template WHERE create_uid=" + str(request.session.uid) + ";")
        count = request.env.cr.fetchone()[0] / 6
        if isinstance(count, (float)):
            count = int(count) + 1
        if userType == "service_provider":
            results = request.env['product.template'].sudo().search_read([('create_uid', '=', request.session.uid)], [
                'id', 'image_1920', 'name', 'type', 'list_price', 'active'], offset=offset, limit=limit, order=order)
        else:
            results = request.env['product.template'].sudo().search_read(
                [], ['id', 'image_1920', 'name', 'type', 'list_price', 'active'], offset=offset, limit=limit, order=order)
        product_data = None
        if product:
            product_data = request.env['product.template'].sudo().browse([
                product])
        return {"results": results, 'count': count, 'order': order, "product": product_data, 'userType': userType}

    @http.route('/get_product', auth='user', type="json")
    def getProduct(self, product_id=None):
        product = None
        if product_id:
            product = request.env['product.product'].sudo().browse([
                product_id])
        return {"product": product}

    @http.route('/get_all_country', type='json', auth="user", csrf=False)
    def get_all_country(self):
        countryList = request.env['res.country'].sudo().search_read([], [
            'id', 'name'])
        return {"countryList": countryList}

    @http.route('/print/service/delete/service', auth='user', type="json")
    def deleteService(self, product=None):
        if product:
            request.env['product.product'].sudo().browse(
                [product]).write({'active': False})
        return

    @http.route('/print/service/add/service', auth='user', type="http", methods=['POST'], csrf=False)
    def addService(self, **kw):
        msg = None
        if kw:
            request.env['product.product'].sudo().create({
                'name': kw.get('name'),
                'type': kw.get('type'),
                'standard_price': kw.get('standard_price'),
                'list_price': kw.get('list_price'),
                'image_1920': base64.b64encode(kw.get('image_1920').read()),
                'description_sale': kw.get('description'),
                'uom_id': 1,
                'uom_po_id': 1
            })
            msg = True
        return http.local_redirect("/home")

    @http.route('/get_order_details', type='json', auth="user")
    def get_order_details(self):
        domain = [
            ('user_id', '=', request.env.user.partner_id.id),
            ('state', 'in', ['sale', 'done'])
        ]
        return request.env['sale.order'].sudo().search_read(domain, ['id', 'name', 'date_order', 'amount_total'])

    @http.route('/order_detail', type='json', auth="user", csrf=False)
    def order_data(self, **kw):
        order = request.env['sale.order'].sudo().search(
            [('id', '=', kw.get('order_id'))])
        order_detail = order.order_line.read(
            ['id', 'name', 'price_unit', 'price_tax', 'price_total', 'product_uom_qty', 'product_id'])
        products = {}
        for line in order.order_line:
            products[line.id] = line.product_id.image_1920
        sale_detail = order.read(['name', 'date_order'])
        partner_detail = order.partner_id.read(
            ['id', 'name', 'street', 'city', 'zip'])
        return {'details': order_detail, 'order': sale_detail, 'partner': partner_detail, 'products': products}

    @http.route('/paytm/payment', auth='user', type="json")
    def payment(self, **kw):
        inquiry = request.env['crm.lead'].sudo().browse([int(kw.get('inquiry_id'))])
        base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')
        data_dict = {
            'MID': 'TinyER40943268666403',
            'WEBSITE': 'WEBSTAGING',
            'ORDER_ID': str(inquiry.order_reference),
            'CUST_ID': str(request.uid),
            'INDUSTRY_TYPE_ID': 'Retail',
            'CHANNEL_ID': 'WEB',
            'TXN_AMOUNT': str(inquiry.planned_revenue),
            'CALLBACK_URL': urls.url_join(base_url, '/paytm_response')
        }
        data_dict['CHECKSUMHASH'] = checksum.generate_checksum(data_dict, 'XdanaSDPoWj#!P7s')
        data_dict['redirection_url'] = 'https://securegw-stage.paytm.in/order/process'
        return data_dict

    @http.route('/paytm_response', type="http", csrf=False)
    def paytm_response(self, **kw):
        print('\n\n\n', kw)
        if checksum.verify_checksum(kw, 'XdanaSDPoWj#!P7s', kw.get('CHECKSUMHASH')):
            if(kw.get('STATUS') == 'TXN_SUCCESS'):
                return http.local_redirect('/print/service/inquiry/payment', kw)
            elif(kw.get('STATUS') == 'TXN_FAILURE'):
                pass
            return http.local_redirect('/home')
        else:
            return http.local_redirect("/home")

    @http.route('/print/service/save/feedback', type='http', methods=['POST'], auth="user", csrf=False)
    def saveFeedback(self, **kw):
        print('\n\n', kw)
        if kw:
            res_name = request.env['product.template'].sudo().browse([int(kw.get('product_id'))]).name
            request.env['rating.rating'].sudo().create({
                    'rated_partner_id': kw.get('partner_id'),
                    'feedback': kw.get('feedback'),
                    'rating_text': kw.get('rating'),
                    'res_name': res_name,
                    'res_id': int(kw.get('product_id'))
                })
            print('\n\nDone', res_name)
        return http.local_redirect('/home')

    @http.route('/get_feedback_data', type='json', auth="user")
    def get_feedback_data(self):
        return request.env['rating.rating'].sudo().search_read([('rated_partner_id', '=', request.uid)], ['res_name', 'feedback', 'rating_text'])
