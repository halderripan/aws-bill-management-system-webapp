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
    }
}

module.exports = {
    REQUEST_PARAM
}