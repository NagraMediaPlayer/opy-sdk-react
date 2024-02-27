
require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "React-otvplayer"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]
  # s.license      = { :type => "MIT", :file => "FILE_LICENSE" }
  s.author             = { "author" => "author@domain.cn" }
  s.platforms     = {:ios => "12.0", :tvos=> "12.0"}
  s.source       = { :git => "https://github.com/author/React-otvplayer.git", :tag => "master" }
  s.requires_arc = false
  s.swift_version = '5.0'
  s.module_name = "react_otvplayer"
  s.ios.vendored_frameworks = 'ios/OPYSDKFPS.xcframework','ios/libRNOTVPlayer.xcframework'
  s.tvos.vendored_frameworks = 'tvos/OPYSDKFPSTv.xcframework','tvos/libRNOTVPlayer-tvOS.xcframework'
  s.dependency "React"

  s.ios.xcconfig = { 'FRAMEWORK_SEARCH_PATHS' => '"$(inherited)" "$(SRCROOT)/../node_modules/@nagra/react-otvplayer/ios/"'}
  s.tvos.xcconfig = { 'FRAMEWORK_SEARCH_PATHS' => '"$(inherited)" "$(SRCROOT)/../node_modules/@nagra/react-otvplayer/tvos/"'}
  

end

  
