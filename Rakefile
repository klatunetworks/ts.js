def npm command, **opts
  system("npm exec -- #{command}", **{ exception: true }.merge(opts))
end

def coffee subcommand, **opts
  npm("coffee #{subcommand}", **opts)
end

def minify subcommand, **opts
  npm("minify #{subcommand}", **opts)
end

def file_list
  parts = [
    "ts.coffee"
  ].flatten.uniq
end

def bundle files
  files.collect { |file|
    File.open(file).read
  }.join("\r\n")
end

def convert
  system 'mkdir -p ./build'
  npm("browserify -t [ coffeeify --header ] ts.coffee -o build/ts.js")
end

task :default => :minify

task :test do
  coffee "tests/runner.coffee"
end

task :minify => :build do
  minify("build/ts.js > build/ts.min.js")
end

task :build => :clean do
  convert
end

task :clean do
  system 'rm -dr ./build'
end

task :cbuild do
  coffee "-w -c ts.coffee"
end

desc "Watch files and run the spec, coffee --watch on many + run"
task :autotest => [:test] do

  require "eventmachine"

  $last = Time.now

  module Handler
    def file_modified
      if Time.now - $last > 1
        $last = Time.now
        convert
        coffee "tests/runner.coffee"
      end
    end
  end

  EM.kqueue if EM.kqueue?
  EM.run do
    ["."].collect { |dir|
      Dir.glob(File.dirname(__FILE__) + "/#{dir}/**/*.coffee")
    }.flatten.each do |file|
       puts file
      EM.watch_file file, Handler
    end
  end
end
