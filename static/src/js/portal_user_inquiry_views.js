odoo.define('print_service.portal_user_inquiry_views', function(require) {
    "use strict";

    const rpc = require('web.rpc');

    const { Component, hooks } = owl;
    const { xml } = owl.tags;
    const { whenReady } = owl.utils;

    class PortalUserInquiryViews extends Component {

        async willStart() {
            this.inquiries = await this._getinquiries();
        }

        async _getinquiries() {
            this.inquiriesData = await rpc.query({route: "/get_inquiry_data"});
            return this.inquiriesData;
        }

        acceptInquiry(ev) {
            let inquiry_id = ev.currentTarget.getAttribute('inquiry_id');
            let amount = prompt("Please enter amount");
            if (amount == '') {
                alert('Invalid value');
                return
            }
            if (amount == null) {
                return
            }
            rpc.query({route: "/print/service/accept/inquiry", params: {'inquiry_id': parseInt(inquiry_id), 'amount': parseInt(amount)}});
        }

        rejectInquiry(ev) {
            let inquiry_id = ev.currentTarget.getAttribute('inquiry_id');
            rpc.query({route: "/print/service/reject/inquiry", params: {'inquiry_id': parseInt(inquiry_id)}});
        }

        cancelInquiry(ev) {
            let inquiry_id = ev.currentTarget.getAttribute('inquiry_id');
            rpc.query({route: "/print/service/cancel/inquiry", params: {'inquiry_id': parseInt(inquiry_id)}});
        }

        async payNow(ev) {
            let inquiry_id = ev.currentTarget.getAttribute('inquiry_id');
            let data_dict = await this._getPaymentDetails(inquiry_id)
            let form = document.createElement('form');
            form.setAttribute('action', data_dict['redirection_url']);
            delete data_dict['redirection_url'];
            for(const key in data_dict){
                let new_element = document.createElement('input');
                new_element.setAttribute('name', key)
                new_element.setAttribute('value', data_dict[key])
                form.append(new_element)
            }
            document.getElementsByTagName('body')[0].append(form);
            form.submit()
        }

        _getPaymentDetails(inquiry_id) {
            return rpc.query({route: "/paytm/payment", params: {'inquiry_id': parseInt(inquiry_id)}});
        }

        static template = xml `
            <div><t t-esc="data_dict"/>
                <h2 class="text-center p-2">Inquiry List</h2>
                <table class="table table-striped table-bordered table-hover">
                    <thead class="thead-dark">
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Service Name</th>
                            <th scope="col">
                                <t t-if="inquiriesData.userType == 'user'">Contact Name</t>
                                <t t-if="inquiriesData.userType == 'service_provider'">Customer Email</t>
                            </th>
                            <t t-if="inquiriesData.userType == 'service_provider'">
                                <th scope="col">Delivery Address</th>
                                <th scope="col">Service Price</th>
                            </t>
                            <th scope="col">Amount</th>
                            <th scope="col">Attachment</th>
                            <th scope="col">Status</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <t t-foreach="inquiries.results" t-as="inquiry">
                            <tr>
                                <td> <t t-esc="inquiry.name" /> </td>
                                <td> <t t-esc="inquiry.product_name" /> </td>
                                <td>
                                    <t t-if="inquiriesData.userType == 'user'">
                                        <t t-esc="inquiry.partner_name" />
                                    </t>
                                    <t t-if="inquiriesData.userType == 'service_provider'">
                                        <t t-esc="inquiry.email_to" />
                                    </t>
                                </td>
                                <t t-if="inquiriesData.userType == 'service_provider'">
                                    <td>
                                        <t t-esc="inquiry.street"/><br/>

                                        <t t-if="inquiry.street2 != ''">
                                            <t t-esc="inquiry.street2"/><br/>
                                        </t>

                                        <t t-esc="inquiry.city"/><br/>
                                        <t t-esc="inquiry.zip"/>,
                                        <t t-esc="inquiry.country_id[1]"/>
                                    </td>
                                    <td>
                                        $<t t-esc="inquiries.product_price[inquiry.id]"/>
                                    </td>
                                </t>
                                <td>
                                    <t t-if="inquiry.planned_revenue != 0">
                                        $<t t-esc="inquiry.planned_revenue" />
                                    </t>
                                    <t t-else="">
                                        -
                                    </t>
                                </td>
                                <td>
                                    <a t-att-href="'data:image/jpg;base64,' + inquiry.attachment"><i class="fa fa-download" style="font-size:24px"></i></a>
                                </td>
                                <t t-if="inquiries.userType == 'user'">
                                <td>
                                    <span class="badge badge-pill badge-info">
                                        <t t-if="inquiry.state == 'pending'">
                                            <i class="fa fa-fw fa-clock-o" aria-label="Opened" title="Opened" role="img"></i>
                                            <span class="d-none d-md-inline"> Waiting for Accept</span>
                                        </t>
                                        <t t-if="inquiry.state == 'accept'">
                                            <i class="fa fa-check-circle" aria-label="Opened" title="Opened" role="img"></i>
                                            <span class="d-none d-md-inline"> Inquiry Accepted </span>
                                        </t>
                                        <t t-if="inquiry.state == 'reject'">
                                            <i class="fa fa-window-close" aria-label="Opened" title="Opened" role="img"></i>
                                            <span class="d-none d-md-inline"> Inquiry Rejected </span>
                                        </t> 
                                    </span>
                                </td>
                                <td>
                                    <t t-if="inquiry.state == 'pending'">
                                        <a t-att-inquiry_id="inquiry.id" class="btn btn-danger btn-sm mx-2" href="#!" t-on-click="cancelInquiry">Cancel</a>
                                    </t>
                                    <t t-if="inquiry.state == 'accept'">
                                        <a t-att-inquiry_id="inquiry.id" class="btn btn-success btn-sm mx-2" href="#!" t-on-click="payNow">Pay now</a>
                                        <a t-att-inquiry_id="inquiry.id" class="btn btn-danger btn-sm" href="#!" t-on-click="cancelInquiry">Cancel</a>
                                    </t>
                                </td>
                                </t>
                                <t t-if="inquiriesData.userType == 'service_provider'">
                                <td>
                                    <t t-if="inquiry.state == 'accept'">
                                        <span class="badge badge-pill badge-info">
                                            <i class="fa fa-fw fa-clock-o" aria-label="Opened" title="Opened" role="img"></i>
                                            <span class="d-none d-md-inline"> Waiting for Payment</span>
                                        </span>
                                    </t>
                                    <t t-if="inquiry.state == 'reject'">
                                        <span class="badge badge-pill badge-info">
                                            <i class="fa fa-window-close" aria-label="Opened" title="Opened" role="img"></i>
                                            <span class="d-none d-md-inline"> Inquiry Rejected </span>
                                        </span>
                                    </t>
                                </td>
                                <td>
                                    <t t-if="inquiry.state == 'pending'">
                                        <a t-att-inquiry_id="inquiry.id" class="btn btn-success btn-sm mx-1" href="#!" t-on-click="acceptInquiry">Accept</a>
                                        <a t-att-inquiry_id="inquiry.id" class="btn btn-danger btn-sm" href="#!" t-on-click="rejectInquiry">Reject</a>
                                    </t>
                                </td>
                                </t>
                            </tr>
                        </t>
                    </tbody>
                </table>
            </div>
        `;
    }

    return PortalUserInquiryViews;
});