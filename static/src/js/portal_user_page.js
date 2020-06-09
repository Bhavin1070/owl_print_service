odoo.define('print_service.portal_user_page', function(require) {
    "use strict";

    const { Component, hooks } = owl;
    const { xml } = owl.tags;
    const { whenReady } = owl.utils;

    class PortalHomePage extends Component {
        static template = xml `
            <div class="container">
                <h1 class="text-center" style="margin-top: 25%;">Welcome to Online Print Service.</h1>
            </div>
        `;
    }

    return PortalHomePage;
});