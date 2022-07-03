const config = {
    server                  : process.env.SERVER, 
    database                : process.env.DATABASE,
    port                    : process.env.DB_PORT,
    options                 :
    {
      trustedConnection     : true,
      enableArithAbort      :true
    },
    connectionTimeout       : 150000,
    pool                    :
    {
      max                   : 10,
      min                   : 0,
      idleTimeoutMillis     : 30000,
    },
};

module.exports = config;