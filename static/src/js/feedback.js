odoo.define('print_service.feedback', function(require) {
    "use strict";

    const rpc = require('web.rpc');

    const { Component, hooks } = owl;
    const { xml } = owl.tags;
    const { whenReady } = owl.utils;

    class PortalFeedbackViews extends Component {

        async willStart() {
            this.feedback = await this._getFeedback();
        }

        async _getFeedback() {
            this.feedbackData = await rpc.query({route: "/get_feedback_data"});
            return this.feedbackData;
        }

        static template = xml `
            <div><t t-esc="data_dict"/>
                <h2 class="text-center p-2">Feedback List</h2>
                <table class="table table-striped table-bordered table-hover">
                    <thead class="thead-dark">
                        <tr>
                            <th scope="col">Service Name</th>
                            <th scope="col">Comment</th>
                            <th scope="col">Rating Text</th>
                        </tr>
                    </thead>
                    <tbody>
                        <t t-foreach="feedbackData" t-as="feedback">
                            <tr>
                                <td> <t t-esc="feedback.res_name" /> </td>
                                <td> <t t-esc="feedback.feedback" /> </td>
                                <td> <t t-esc="feedback.rating_text" /> </td>
                            </tr>
                        </t>
                    </tbody>
                </table>
            </div>
        `;
    }

    return PortalFeedbackViews;
});