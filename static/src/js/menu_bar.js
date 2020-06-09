odoo.define('print_service.menu_bar', function (require) {
    "use strict";

    require('web.dom_ready');
    if (!$('.menu_item').length) {
        return Promise.reject("DOM doesn't contain '.menu_item'");
    }

    const rpc = require('web.rpc');
    const order = require('print_service.order_page');
    const dashboard = require('print_service.orders_detail');
    const inquiry = require('print_service.portal_user_inquiry_views');
    const home = require('print_service.portal_user_page');
    const services = require('print_service.portal_user_print_services_card_views');
    const feedback = require('print_service.feedback');

    const { Component } = owl;
    const { xml } = owl.tags;
    const { whenReady } = owl.utils;

    class Menu extends Component {

        async willStart() {
            this.userType = await this._getUserType()
            if (this.userType == "service_provider") {
                const instance = new dashboard();
                instance.mount($('.component_view')[0]);
            } else {
                const instance = new home();
                instance.mount($('.component_view')[0]);
            }
        }

        _getUserType() {
            return rpc.query({route: "/print/service/getUserType"});
        }

         _renderMenuItem(mode) {
            if (mode === 'home') {
                const instance = new home();
                instance.mount($('.component_view')[0]);
            } else if (mode === 'dashboard') {
                const instance = new dashboard();
                instance.mount($('.component_view')[0]);
            } else if (mode === 'services') {
                const instance = new services();
                instance.mount($('.component_view')[0]);
            } else if (mode === 'inquiry') {
                const instance = new inquiry();
                instance.mount($('.component_view')[0]);
            } else if (mode === 'order') {
                const instance = new order();
                instance.mount($('.component_view')[0]);
            } else if (mode === 'feedback') {
                const instance = new feedback();
                instance.mount($('.component_view')[0]);
            }
        }

        _onClickMenuItem(ev) {
            ev.preventDefault();
            const mode = ev.target.dataset.mode;
            $('.component_view').html('');
            this._renderMenuItem(mode);
        }

        static template = xml`
            <nav class="navbar navbar-expand-lg navbar-light bg-light">
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav" t-on-click="_onClickMenuItem">

                        <t t-if="userType == 'user'">
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-mode="home">Home</a>
                            </li>
                        </t>

                        <t t-if="userType == 'service_provider'">
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-mode="dashboard">Dashboard</a>
                            </li>
                        </t>

                        <li class="nav-item">
                            <a class="nav-link" href="#" data-mode="services">
                                <t t-if="userType == 'user'">Print Services</t>
                                <t t-if="userType == 'service_provider'">My Services</t>
                            </a>
                        </li>

                        <li class="nav-item">
                            <a class="nav-link" href="#" data-mode="inquiry">
                                <t t-if="userType == 'user'">Inquiry</t>
                                <t t-if="userType == 'service_provider'">My Inquiry</t>
                            </a>
                        </li>

                        <li class="nav-item">
                            <a class="nav-link" href="#" data-mode="order">
                                <t t-if="userType == 'user'">Order</t>
                                <t t-if="userType == 'service_provider'">My Order</t>
                            </a>
                        </li>

                        <t t-if="userType == 'service_provider'">
                            <li class="nav-item">
                                <a class="nav-link" href="#" data-mode="feedback">Feedback</a>
                            </li>
                        </t>

                    </ul>
                </div>
            </nav>
        `;
    }

    function setup() {
        const MenuInstance = new Menu();
        $('.o_portal.container').html('');
        MenuInstance.mount($('.o_portal.container')[0]);
    }

    whenReady(setup);

    return Menu;
});