odoo.define('print_service.order_page', function(require) {
    "use strict";

    const rpc = require('web.rpc');

    const { Component, hooks } = owl;
    const { xml } = owl.tags;
    const { whenReady } = owl.utils;

    class OrderDetails extends Component {

        constructor(order_id) {
            super()
            this.order_id = order_id;
        }

        async willStart() {
            this.orderdetail = await this.getdetails();
        }

        async getdetails () {
            const details = await rpc.query({route: "/order_detail", params: {order_id: this.order_id}});
            return details;
        }

        get details ()  {
            return this.orderdetail;
        }

        async modelFunction(ev) {
            const instance = new OrderView();
            instance.mount($('.component_view')[0]);
            this.destroy();
        }

        static template = xml`
        <div class="container-fluid">
            <br/><br/>
            <div class="card">
                <t t-foreach="details.order" t-as="order">
                    <div class="card-header bg-primary">
                        <h4><span t-esc="order.name"/><span class="pull-left fa fa-arrow-left" t-on-click="modelFunction()"/></h4>
                    </div>
                    <div class="card-body">
                        <h5>Order Date : <span t-esc="order.date_order"/></h5>
                        <t t-foreach="details.partner" t-as="partner">
                            <h5>Delivery Address : </h5>
                            <h6> <span t-esc="partner.name" /> , </h6>
                            <h6> <span t-esc="partner.street" /> , </h6>
                            <h6><span t-esc="partner.city"/> - <span t-esc="partner.zip"/></h6>
                            <br/><br/>
                        </t>
                <br/><br/>
                    <table class="table table-striped  table-hover">
                    <thead class="thead-dark">
                        <th>Name</th>
                        <th>Image</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Taxes</th>
                        <th>Amount</th>
                    </thead>
                    <t t-set="summ" t-value="0.0"/>
                    
                        <t t-foreach="details.details" t-as="d">
                            
                            <tr class="value">
                                <td><span t-esc="d.name" /></td>
                                <td>
                                    <img t-attf-src="data:image/png;base64, {{details.products[d.id]}}" style="width:30%;"/>
                                </td>
                                
                                <td><span t-esc="d.product_uom_qty" /></td>
                                <td><span t-esc="d.price_unit" /></td>
                                <td class="sum"><span t-esc="d.price_tax" /></td>
                                <td class="sum"><span t-esc="d.price_total" /></td>
                                <t t-set="summ" t-value="summ + d.price_total + d.price_tax" />
                            </tr>
                    </t>
                    <tr>
                        <td class="text-right" colspan="5"><h5>SubTotal : </h5></td>
                        <td><h5><span t-esc="summ"/></h5></td>
                    </tr>
                    </table>
                </div> 
                </t>       
            </div>
        </div>
        `;
    }

    class OrderView extends Component {

        async willStart() {
            this.orderData = await this._getorder();
        }

        async _getorder() {
            this.orderData = await rpc.query({route: "/print/service/get/order"});
            return this.orderData;
        }

        async modelFunction(ev){
            let order_id = ev.currentTarget.getAttribute('order_id');
            const instance = new OrderDetails(order_id);
            instance.mount($('.component_view')[0]);
            this.destroy();
        }

        _onClickLink(ev) {
            ev.preventDefault();
            let state = ev.currentTarget.getAttribute('state');
            let order_id = ev.currentTarget.getAttribute('order_id');
            rpc.query({
                route: "/print/service/change/order/state",
                params: { state: state, order_id: order_id }
            });
            this.render(true);
        }

        _saveFeedback(ev) {
            ev.preventDefault();
            let product_id = ev.currentTarget.getAttribute('product_id');
            let rated_partner_id = ev.currentTarget.getAttribute('rated_partner_id');
            this.feedback = document.getElementsByName('feedback')[0].value
            this.rating = document.getElementsByName('rating')[0].value
            rpc.query({
                route: "/print/service/save/feedback",
                params: { product_id: product_id, rated_partner_id: rated_partner_id, feedback: this.feedback , rating: this.rating }
            });
            this.render(true);
        }

        static template = xml `
            <div>
                <h2 class="text-center p-2">Order History</h2>
                <table class="table table-striped table-bordered table-hover">
                    <thead class="thead-dark">
                        <tr>
                            <th scope="col">Order#</th>
                            <th scope="col">Service Name</th>
                            <t t-if="orderData.userType == 'user'">
                                <th scope="col">Service By</th>
                            </t>
                            <th scope="col">Amount</th>
                            <t t-if="orderData.userType == 'user'">
                                <th scope="col">Status</th>
                            </t>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <t t-foreach="orderData.details" t-as="order">
                            <tr>
                                <td> <a t-on-click="modelFunction" t-att-order_id="orderData.order_id[order.id]" href="#!"><t t-esc="order.order_id[1]"/></a> </td>
                                <td> <t t-esc="order.name" /> </td>
                                <t t-if="orderData.userType == 'user'">
                                    <td> <t t-esc="orderData.company_name[order.id]" /> </td>
                                </t>
                                <td>
                                    $<t t-esc="order.price_total" />
                                </td>
                                <t t-if="orderData.userType == 'user'">
                                <td>
                                    <t t-if="orderData.sales[order.id] == 'draft'">
                                        Pending
                                    </t>
                                    <t t-if="orderData.sales[order.id] == 'sent'">
                                        In Progress
                                    </t>
                                    <t t-if="orderData.sales[order.id] == 'sale'">
                                        Complated
                                    </t>
                                    <t t-if="orderData.sales[order.id] == 'done'">
                                        Delivered
                                    </t>
                                </td>
                                </t>
                                <td>
                                    <t t-if="orderData.userType == 'service_provider'">
                                        <div class="dropdown show btn-group">
                                            <button class="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <t t-if="orderData.sales[order.id] == 'draft'">
                                                Pending
                                            </t>
                                            <t t-if="orderData.sales[order.id] == 'sent'">
                                                In Progress
                                            </t>
                                            <t t-if="orderData.sales[order.id] == 'sale'">
                                                Complated
                                            </t>
                                            <t t-if="orderData.sales[order.id] == 'done'">
                                                Delivered
                                            </t>
                                            </button>
                                            <div class="dropdown-menu">
                                                <a class="dropdown-item" t-att-order_id="order.id" state="draft" t-on-click="_onClickLink" href="#!">Pending</a>
                                                <a class="dropdown-item" t-att-order_id="order.id" state="sent" t-on-click="_onClickLink" href="#!">In Progress</a>
                                                <a class="dropdown-item" t-att-order_id="order.id" state="sale" t-on-click="_onClickLink" href="#!">Complated</a>
                                                <a class="dropdown-item" t-att-order_id="order.id" state="done" t-on-click="_onClickLink" href="#!">Delivered</a>
                                            </div>
                                        </div>
                                    </t>
                                    <t t-if="orderData.userType == 'user'">
                                        <t t-if="orderData.sales[order.id] == 'done'">
                                        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#feedbackForm">
                                            Feedback
                                        </button>

                                        <div class="modal fade" id="feedbackForm" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
                                            <div class="modal-dialog modal-dialog-centered" role="document">
                                                <div class="modal-content">
                                                    <div class="modal-header">
                                                    <h5 class="modal-title" id="exampleModalLongTitle">Feedback Form</h5>
                                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                          <span aria-hidden="true"><i class="fa fa-close"></i></span>
                                                        </button>
                                                    </div>
                                                    <form action="/print/service/save/feedback" method="POST">
                                                    <input type="text" name="product_id" t-att-value="order.product_id[0]" hidden=""/>
                                                    <input type="text" name="partner_id" t-att-value="orderData.partner[order.id]" hidden=""/>
                                                        <div class="modal-body">
                                                            <div class="form-group">
                                                                <label>Comment:</label>
                                                                <input type="text" class="form-control" name="feedback" placeholder="Enter Your Comment"/>
                                                            </div>
                                                            <div class="form-group">
                                                                <label>Select Rating</label>   
                                                                <select class="form-control" name="rating">
                                                                    <option value="satisfied">Satisfied</option>
                                                                    <option value="not_satisfied">Not Satisfied</option>
                                                                    <option value="highly_dissatisfied">Highly dissatisfied</option>
                                                                    <option value="no_rating">No Rating yet</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div class="modal-footer">
                                                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                                            <button type="submit" class="btn btn-primary">Save</button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                        </t>
                                    </t>
                                </td>
                            </tr>
                        </t>
                    </tbody>
                </table>
            </div>
        `;
    }

    return OrderView;
});