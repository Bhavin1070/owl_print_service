odoo.define('print_service.portal_user_print_services_card_views', function(require) {
    "use strict";

    const rpc = require('web.rpc');

    const { Component, hooks } = owl;
    const { xml } = owl.tags;
    const { whenReady } = owl.utils;

    class PortalPrintServicesCardView extends Component {

        offset = 1;
        limit = 6
        count = [];
        dropdown_order = "--select--"
        order = {
            "name_asc": "name asc",
            "name_desc": "name desc",
            "list_price_asc": "list_price asc",
            "list_price_desc": "list_price desc"
        }

        async willStart() {
            this.productsData = await this._getProducts(this.offset);
            for (let index = 1; index <= parseInt(this.productsData.count); index++) {
                this.count.push(index);
            }
        }

        async _onClickLink(ev) {
            ev.preventDefault();
            let offset = ev.currentTarget.getAttribute('offset');
            let order = ev.currentTarget.getAttribute('order');
            let product = ev.currentTarget.getAttribute('product');
            if (order == "null"){
                order = "name asc"
            }
            this.productsData = await this._getProducts(offset, order, product);
            this.dropdown_order = this._getOrderName(order);
            this.render(true);
        }

        _getOrderName(order) {
            if (order == "name asc") {
                this.order_name = "Name : A to Z"
            } else if (order == "name desc") {
                this.order_name = "Name : Z to A"
            } else if (order == "list_price asc") {
                this.order_name = "Price : Low to High"
            } else if (order == "list_price desc") {
                this.order_name = "Price : High to Low"
            } else {
                this.order_name = "--select--"
            }
            return this.order_name;
        }

        async _getProducts(offset, order, product) {
            this.Products = await rpc.query({
                route: "/get_product_data",
                params: { offset: parseInt(offset), limit: this.limit, order: order, product: parseInt(product) }
            });
            return this.Products;
        }

        async _deleteService(ev) {
            ev.preventDefault();
            let product = ev.currentTarget.getAttribute('product');
            rpc.query({
                route: "/print/service/delete/service",
                params: { product: parseInt(product) }
            });
            this.willStart()
        }

        async _onButtonKeyup(ev) {
            var input, filter, ulcontent, li, i, txtValue;
            input = document.getElementById("search");
            filter = input.value.toUpperCase();
            ulcontent = document.getElementById("ulcontent")
            li = ulcontent.getElementsByTagName("li");
            txtValue = document.getElementsByClassName('text-lowercase');
            for (i = 0; i < li.length; i++) {
                if (!txtValue[i].innerHTML.toUpperCase().includes(filter)) { 
                    li[i].style.display="none"; 
                } 
                else { 
                    li[i].style.display="";                  
                }
            }
            this.render(true);
        }

        inquiryForm(ev) {
            if (ev.target.dataset.mode == 'showInquiryForm') {
                let product = ev.currentTarget.getAttribute('product');
                const PortalUserInquiryCreateFormInstance = new PortalUserInquiryCreateForm(product);
                PortalUserInquiryCreateFormInstance.mount($('.component_view')[0]);
                this.destroy();
            } else {
                this.render(true);
            }
        }

        AddServiceForm(ev) {
            if (ev.target.dataset.mode == 'showAddServiceForm') {
                const AddServiceFormInstance = new AddServiceForm();
                AddServiceFormInstance.mount($('.component_view')[0]);
                this.destroy();
            } else {
                this.render(true);
            }
        }

        static template = xml `
            <div id="main">
                <section id="content">
                    <div>
                        <form class="form-inline">
                            <input class="form-control mr-sm-2" type="text" id="search" name="search" t-on-keyup="_onButtonKeyup" placeholder="Search"/>
                            <div class="dropdown show btn-group pull-right my-1 mx-1">
                                <button class="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Sort By : <span t-esc="dropdown_order"/>
                                </button>
                                <div class="dropdown-menu">
                                    <a class="dropdown-item" t-att-offset="offset" t-att-order="order['name_asc']" t-on-click="_onClickLink" href="#!">Name : A to Z</a>
                                    <a class="dropdown-item" t-att-offset="offset" t-att-order="order['name_desc']" t-on-click="_onClickLink" href="#!">Name : Z to A</a>
                                    <a class="dropdown-item" t-att-offset="offset" t-att-order="order['list_price_asc']" t-on-click="_onClickLink" href="#!">Price : Low to High</a>
                                    <a class="dropdown-item" t-att-offset="offset" t-att-order="order['list_price_desc']" t-on-click="_onClickLink" href="#!">Price : High to Low</a>
                                </div>
                            </div>
                            <t t-if="productsData.userType == 'service_provider'">
                                <div class="add-service">
                                    <a class="btn btn-primary pull-right my-1 mx-1" data-mode="showAddServiceForm" t-on-click="AddServiceForm" href="#!">Add Service</a>
                                </div>
                            </t>
                        </form>
                    </div>
                    <div id="left">
                        <ul id="ulcontent">
                            <t t-log='partner_templates' />
                            <t t-as="product" t-foreach="productsData.results">
                                <li>
                                    <div class="img">
                                        <img t-att-src="'data:image/jpg;base64,' + product.image_1920" />
                                    </div>
                                    <div class="info text-wrap">
                                        <a class="title" href="#">
                                        <p class="text-lowercase">
                                            <t t-esc="product.name" />
                                        </p>
                                        </a>
                                        <p><b>Type : </b>
                                            <t t-if="product.type == 'consu'">Consumable</t>
                                            <t t-else="">
                                                <t t-esc="product.type" />
                                            </t>
                                        </p>
                                        <div class="price1">
                                            <span class="st">price:</span>
                                            <strong>
                                                    <span>$
                                                        <t t-esc="product.list_price" />
                                                        </span></strong>
                                        </div>
                                        <div class="actions">
                                            <t t-if="productsData.userType == 'user'">
                                                <a t-att-product="product.id" data-mode="showInquiryForm" t-on-click="inquiryForm" href="#!">Inquiry</a>
                                            </t>
                                            <t t-if="productsData.userType == 'service_provider'">
                                                <a t-att-product="product.id" t-on-click="_deleteService" href="#!">Delete</a>
                                            </t>
                                        </div>
                                    </div>
                                </li>
                            </t>
                        </ul>
                    </div>
                </section>
                <div class="d-flex justify-content-center">
                    <nav aria-label="Page navigation example">
                        <ul class="pagination">
                            <t t-set="offset" t-value="0"/>
                            <t t-as="page" t-foreach="count">
                                <li class="page-item">
                                    <a t-att-offset="offset" t-att-order="productsData.order" t-on-click="_onClickLink" class="page-link" href="#!"><span t-esc="page" /></a>
                                    <t t-set="offset" t-value="offset + 6"/>
                                </li>
                            </t>
                        </ul>
                    </nav>
                </div>
            </div>
        `;
    }

    class PortalUserInquiryCreateForm extends Component {

        constructor(product_id) {
            super()
            this.product_id = product_id;
        }

        async willStart() {
            this.countryData = await this._getCountryList();
        }

        _getCountryList() {
            return rpc.query({route: "/get_all_country"});
        }

        productList(ev, action=false) {
            if (ev.target.dataset.mode == 'showProduct' | action == true) {
                const ProductListInstance = new PortalPrintServicesCardView();
                ProductListInstance.mount($('.component_view')[0]);
                this.destroy();
            } else {
                this.render(true);
            }
        }

        // createInquiry(ev) {
        //     debugger;
        //     const formData = document.getElementById("inquiryForm").enctype = "multipart/form-data";
        //     console.log("Test1", formData)
        //     console.log("Test2", typeof formData)
        //     const x = document.getElementById("inquiryForm").elements['attachment'].value;
        //     console.log("Test3", x)
        //     console.log("Test4", typeof x)
            // this.name = document.getElementsByName('name')[0].value
            // this.description = document.getElementsByName('description')[0].value
            // this.street = document.getElementsByName('street')[0].value
            // this.street2 = document.getElementsByName('street2')[0].value
            // this.city = document.getElementsByName('city')[0].value
            // this.zip = document.getElementsByName('zip')[0].value
            // this.country_id = document.getElementsByName('country_id')[0].value
            // rpc.query({
            //     route: "/print/service/create/inquiry",
            //     params: { product_id: this.product_id,
            //             name: this.name,
            //             description: this.description,
            //             street: this.street,
            //             street2: this.street2,
            //             city: this.city,
            //             zip: this.zip,
            //             country_id: this.country_id,
            //         }
            // });
            // rpc.query({
            //     route: "/test",
            //     params: { img: ev.srcElement.files[0] }
            // });
        //     debugger;
        //     this.productList(ev, true)
        // }

        static template = xml `
            <div class="col-md-auto">
                <h2 class="text-center">Inquiry Form</h2>
                <form action="/print/service/create/inquiry" method="post" enctype="multipart/form-data">
                    <input type="text" name="product_id" t-att-value="product_id" hidden=""/>
                    <div class="form-group">
                        <label>Inquiry Name</label>
                        <input type="text" class="form-control" name="name" placeholder="Enter Inquiry Name"/>
                    </div>
                    <div class="form-group">
                        <label>Attachment</label>
                        <input id="file-upload" class="form-control" type="file" name='attachment'/>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" class="form-control" name="description" placeholder="Enter Description"/>
                    </div>
                    <div class="form-group">
                        <label>Address Line1</label>
                        <input type="text" class="form-control" name="street" placeholder="Address Line1"/>
                    </div>
                    <div class="form-group">
                        <label>Address Line2</label>
                        <input type="text" class="form-control" name="street2" placeholder="Address Line2"/>
                    </div>
                    <div class="form-group">
                        <label>City</label>
                        <input type="text" class="form-control" name="city" placeholder="Enter City"/>
                    </div>
                    <div class="form-group">
                        <label>Pincode/zipcode</label>
                        <input type="text" class="form-control" name="zip" placeholder="Enter Pincode/zipcode"/>
                    </div>
                    <div class="form-group">
                        <label>Country</label>   
                        <select class="form-control" name="country_id">
                            <t t-foreach="countryData.countryList" t-as="country">
                                <option t-att-value="country.id"><t t-esc="country.name"/></option>
                            </t>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-success mx-2">Submit</button>
                    <a class="btn btn-primary" data-mode="showProduct" t-on-click="productList" href="#!">Cancel</a>
                </form>
            </div>
        `;
    }

    class AddServiceForm extends Component {

        productList(ev, action=false) {
            if (ev.target.dataset.mode == 'showProduct' | action == true) {
                const ProductListInstance = new PortalPrintServicesCardView();
                ProductListInstance.mount($('.component_view')[0]);
                this.destroy();
            } else {
                this.render(true);
            }
        }

        addService(ev) {
            this.default_code = document.getElementsByName('default_code')[0].value
            this.name = document.getElementsByName('name')[0].value
            this.type = document.getElementsByName('type')[0].value
            this.weight = document.getElementsByName('weight')[0].value
            this.price = document.getElementsByName('price')[0].value
            this.description = document.getElementsByName('description')[0].value
            this.msg = rpc.query({
                route: "/print/service/add/service",
                params: { default_code: this.default_code, name: this.name, type: this.type, weight: this.weight, price: this.price, description: this.description }
            });
            if (this.msg != "None") {
                alert("Service Successfully Created.");
            }
            this.productList(ev, true)
        }

        static template = xml `
            <div class="col-md-auto">
                <h2 class="text-center">Service Form</h2>
                <form action="/print/service/add/service" method="post" enctype="multipart/form-data">
                    <div class="form-group">
                        <label>Service Name</label>
                        <input type="text" class="form-control" name="name" placeholder="Enter Service Name"/>
                    </div>
                    <div class="form-group">
                        <label>Image</label>
                        <input id="file-upload" class="form-control" type="file" name='image_1920'/>
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select class="form-control" name="type">
                            <option value="consu">Consumable</option>
                            <option value="service">Service</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Standard Price</label>
                        <input type="text" class="form-control" name="standard_price" placeholder="Enter Standard Price"/>
                    </div>
                    <div class="form-group">
                        <label>Sale Price</label>
                        <input type="text" class="form-control" name="list_price" placeholder="Enter Sale Price"/>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" class="form-control" name="description" placeholder="Enter Description"/>
                    </div>
                    <button type="submit" class="btn btn-success mx-2">Submit</button>
                    <a class="btn btn-primary" data-mode="showProduct" t-on-click="productList" href="#!">Cancel</a>
                </form>
            </div>
        `;
    }

    return PortalPrintServicesCardView;
});