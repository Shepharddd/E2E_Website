'''
    This is a file that configures how your server runs
    You may eventually wish to have your own explicit config file
    that this reads from.

    For now this should be sufficient.

    Keep it clean and keep it simple, you're going to have
    Up to 5 people running around breaking this constantly
    If it's all in one file, then things are going to be hard to fix

    If in doubt, `import this`
'''

#-----------------------------------------------------------------------------
import os
import sys
from bottle import run

#-----------------------------------------------------------------------------
# You may eventually wish to put these in their own directories and then load 
# Each file separately

# For the template, we will keep them together

import model
import view as view
import gunicorn
import controller

#-----------------------------------------------------------------------------
class app():

    # It might be a good idea to move the following settings to a config file and then load them
    # Change this to your IP address or 0.0.0.0 when actually hosting
    host = '0.0.0.0'

    # Test port, change to the appropriate port to host
    port = 8081

    # Turn this off for production
    debug = True

    def __init__(self):
        self.run_commands(sys.argv)



    def run_server(self):    
        '''
            run_server
            Runs a bottle server
        '''
        run(
            host=self.host, 
            port=self.port, 
            debug=self.debug,
            server="gunicorn",
            certfile="certs/localhost.crt",
            keyfile="certs/localhost.key",
            )

    #-----------------------------------------------------------------------------
    # Optional SQL support
    # Comment out the current manage_db function, and 
    # uncomment the following one to load an SQLite3 database

    import sql as sql

        
    def manage_db(self):
        '''
            manage_db
            Starts up and re-initialises an SQL databse for the server
        '''
        database_args = "test.db"
        sql_db = self.sql.SQLDatabase(database_args=database_args)
        sql_db.database_setup()
        model.make_db(sql_db)
        return

    default_command = 'server'

    def run_commands(self, args):
        '''
            run_commands
            Parses arguments as commands and runs them if they match the command list

            :: args :: Command line arguments passed to this function
        '''
        self.manage_db()
        self.run_server()

if __name__ == '__main__':
    app = app()
