const REQUEST_PARAM = {
    /**
     * @memberof REQUEST_PARAM
     * @name CREATE_USER holds the request parameters associated with the /v1/user POST API
     * @enum {string}
     */
    CREATE_USER: {
        PASSWORD: 'password',
        FIRSTNAME: 'first_name',
        LASTNAME: 'last_name',
        EMAIL_ADDRESS: 'email_address'
    },
    CREATE_BILL: {
        OWNER_ID: 'owner_id',
        BILL_DATE: 'bill_date',
        DUE_DATE: 'due_date',
        VENDOR: 'vendor',
        AMOUNT_DUE:'amount_due',
        PAYMENTSTATUS:'paymentStatus',
        CATEGORIES:'categories',
        ATTACHMENT : 'attachment'
    }
}

module.exports = {
    REQUEST_PARAM
}