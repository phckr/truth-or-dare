#!/usr/bin/perl

use strict;
use JSON;
use LWP::UserAgent;

use CGI;

my $cgi = new CGI;

print $cgi->header(-type => 'text/javascript; charset=utf-8');

my %excluded = (
   'dare' => [ "anally.", "ry anal"],
);

my $data;

my $iscache = $cgi->param('cache');

if (-s "/tmp/tod.cache" > 0) {
  if ($iscache || (stat("/tmp/tod.cache"))[9] > time() - 3600) {
    open(F, "<:encoding(UTF-8)", "/tmp/tod.cache");
    while (<F>) {
      print;
    }
    close(F);

    exit(0);
  }
}

sub load {
  my $fn = shift @_;

  my @result;

  open(F, "<:encoding(UTF-8)", $fn);
  while (<F>) {
    s/\r//;
    chop;
    s/^ +//;
    s/ +$//;
    s/  +/ /g;
    push @result, $_;
  }
  close(F);

  return \@result;
}

my $ua = LWP::UserAgent->new();

sub loadurl {
  my $url = shift @_;

  my @result;

  my $res = $ua->get($url);
  if (!$res->is_success) {
    return;
  } 

  my %seen;

  foreach $_ (split(/\r*\n/, $res->decoded_content)) {
    s/^ +//;
    s/ +$//;
    s/  +/ /g;
    next if (!$_ || length $_ < 10);
    my $key = lc $_;
    $key =~ s/[^a-z0-9]//g;
    next if ($seen{$key}++);
    push @result, $_;
  }

  return \@result;
}

# truth: https://docs.google.com/document/d/1qfvgeypOiN2YRP4rsLFN2DJQPllZt8UDODMdBWj-9rk/export?format=txt
# dare: https://docs.google.com/document/d/1sIaJ4XkDf1vxN7djsTNeW1aug8JtTIqbSGljK2VFu4g/export?format=txt

# $data = {'truth' => load("/home/philip/tod/Truth.txt"), 'dare' => load("/home/philip/tod/Dare.txt")};
$data = {'truth' => loadurl("https://docs.google.com/document/d/1qfvgeypOiN2YRP4rsLFN2DJQPllZt8UDODMdBWj-9rk/export?format=txt"), 
         'dare' => loadurl("https://docs.google.com/document/d/1sIaJ4XkDf1vxN7djsTNeW1aug8JtTIqbSGljK2VFu4g/export?format=txt")};

foreach my $type (keys %excluded) {
  if ($data->{$type}) {
    my @l = @{$data->{$type}};
    if (@l) {
      foreach my $exc (@{$excluded{$type}}) {
	for (my $i = 0; $i < @l; $i++) {
	  if (index($l[$i], $exc) >= 0) {
	    splice(@l, $i, 1);
	  }
	}
      }
      $data->{$type} = \@l;
    }
  }
}

my $encoded = encode_json $data;

open(F, ">:encoding(UTF-8)", "/tmp/tod.cache");
print F $encoded;
close(F);

print $encoded;
