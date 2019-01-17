{
  "targets": [
    {
      "target_name": "elevator",
      "include_dirs" : [
        "src",
        "<!(node -e \"require('nan')\")"
      ],
      'conditions': [

        [ 'OS=="win"', {
          "sources": [
            "src/utils/v8utils.cpp",
            "src/os/win32/elevate.cpp",
            "src/elevator_init.cpp",
          ],
          "libraries": [
            "-lShell32.lib",
          ],
        } ],

        [ 'OS=="mac"', {
          "xcode_settings": {
            "OTHER_CPLUSPLUSFLAGS": [
              "-stdlib=libc++"
            ],
            "OTHER_LDFLAGS": [
              "-stdlib=libc++"
            ]
          }
        } ]
      ],
    }
  ],
}
