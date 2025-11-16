#!/usr/bin/perl

use strict;
use JSON;
use LWP::UserAgent;
use DBI;
use Data::Dumper;

use CGI;

my $cgi = new CGI;

my $dbh = DBI->connect('DBI:SQLite:dbname=/home/philip/tod/interactions');

my $insert = $dbh->prepare("INSERT INTO log(type, message, button, user, sex) VALUES (?,?,?,?,?)");

my @fields = map { scalar $cgi->param($_) } qw/type message button id sex/;
$insert->execute(@fields);

print $cgi->header(-type => 'application/json; charset=utf-8');

