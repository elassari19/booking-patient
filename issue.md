# after pulling backend update

// used in Ruby on Rails applications to run database migrations in the development environment
bin/rails db:migrate RAILS_ENV=development

// to get vocable plans
rake stripe_sync:sync_products_and_prices

sudo lsof -i :5432
sudo kill -9 143

First, let's check if there's already a PostgreSQL process running:
bash
Run

lsof -i :5432
lsof -i :5432
If there's nothing running, let's try to fix the permissions issue by removing the lock file:
bash
Run

sudo rm /tmp/.s.PGSQL.5432.lock
You might also need to remove the socket file if it exists:
bash
Run

sudo rm /tmp/.s.PGSQL.5432
Then try starting PostgreSQL again with the correct command (note the space between postgresql@15 and start):
bash

Run
brew services start postgresql@15
The main issue in your command was that you didn't have a space between /usr/local/var/postgresql@15 and start. Also, the permission denied error suggests you might need to use sudo or fix the permissions on the lock file.

==================================
sudo lsof -i :5432
sudo kill -9 143
sudo rm /tmp/.s.PGSQL.5432.lock
sudo rm /tmp/.s.PGSQL.5432
brew services start postgresql@15
brew services list
==================================


// ruby server solution
export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"
rbenv shell 3.2.2
ruby --version
