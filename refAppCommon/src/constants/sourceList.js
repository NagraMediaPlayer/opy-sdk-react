// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
const unFilteredSourceListClear = [
	{
		name: 'DASH Live stream, Single adaptation set, 1x1 tiles (livesim)',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/dash-if_livesim/dashif-livesim_2019-01-24/vod/testpic_2s/Manifest_thumbs.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH - BBB Thumbnail Content',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/clear/DASHIFREF/dash.akamaized.net/akamai/bbb_30fps/bbb_with_4_tiles_thumbnails_max_8m.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH BBB Thumbs Multi Clear',
		source: {
			src: 'https://dash.edgesuite.net/akamai/bbb_30fps/bbb_with_multiple_tiled_thumbnails.mpd',
			type: 'application/dash+xml',
		},
	},
	// OTT VOD, Clear
	{
		name: 'Big Buck Bunny [OTT VOD, Clear]',
		source: {
			src: 'https://d3bqrzf9w11pn3.cloudfront.net/basic_dash_bbb_clear/bbb_public.mpd',
			type: 'application/dash+xml',
		},
	},
	// OTT VOD Clear
	// Multiple subtitle
	// Multiple Audio
	{
		name: 'Sintel [OTT VOD Clear, Multiple subtitle, multiple audio]',
		source: {
			src: 'https://d3bqrzf9w11pn3.cloudfront.net/sintel/sintel.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH - Elephants Dream-SSM-Widevine (2 Sessions)',
		source: {
			src: 'https://replacemewithyourown.com/vod/demo_content/ed_elephants_dream_1080p/elephants_dream.mpd?SSM1000 Elephants Dream',
			type: 'application/dash+xml',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDIifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjI3NjUzNGNmLWE3YTgtNGQyOS1iZDY2LTRjNWQ4MmIyMzFjNiJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fZWxlcGhhbnRzX2RyZWFtIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoyLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.dc6BDhjx7ML676ePQJWo1I2M2cd7rRmHItXUQsw91Rs,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..WK6rp-4982ktRUV6C9qYew.WlaXWAEUfI3yID9XILCOc-u7NRqIglsQaMac7lD2-cVVDZLGVRf80XooDbiq9m97ZxUrvo1UBnwKYSNnmgpzw9X4BxCI-P4dAoswsFwgLBjbzpXs4le4kBE3R-ZI_GdNqeqL3h3Lu3O7uYuXAkssY920vdyuIMNgh6XuGz3LFpE.F5_b_NX6e5C7OF-S2FJtrQ',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Widevine', // "com.widevine.alpha"
			},
		},
	},
	{
		name: 'Tears-SSM-Widevine (1000 Sessions)',
		source: {
			src: 'https://replacemewithyourown.com/vod/demo_content/ed_sintel_1080p/sintel.mpd?SSM1000 Sintel',
			type: 'application/dash+xml',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjRkZDY3MGRmLWI4NDgtNDc2Yi1hODYyLTYzMjFjN2FlN2ZkNSJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fc2ludGVsXzRrIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoxMDAwLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.O6P_W5MDtppchgtDcjRf6lGtvndg8qYI0SvX5AsTSNw,eyJrY0lkcyI6WyI0ZGQ2NzBkZi1iODQ4LTQ3NmItYTg2Mi02MzIxYzdhZTdmZDUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..FnAMFZvETeg0qSeT4dIkHg.vxvzTz9qm0i2dyz61E0f7Bx342m-jUF65YdmXbFPir27_bMdHgYOuMPDK8zG9rXivMBjMfJ0zhTuOAFgZS1hWWmPM_dGih8aO1LBxcNLF46oamrkhvlg7AweyNFi66jYt3Pg_X2zfoH-8hScHqtSNA3I4xy1pQhZHT5GdaQZj-c.Ml7dqvscUJKPJRDuwOuHXg',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Widevine', // "com.widevine.alpha"
			},
		},
	},
	{
		name: 'Big Buck Bunny-SSM-Widevine (1000 Sessions)',
		source: {
			src: 'https://replacemewithyourown.com/vod/demo_content/ed_big_buck_bunny_1080p/big_buck_bunny.mpd?SSM1KBig Buck Bunny',
			type: 'application/dash+xml',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbImIxM2U0NWQwLTAzMjQtNDZkZC04NGQ1LTNiMmQ2NzkyZWIzNCJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fYmlnX2J1Y2tfYnVubnkiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwic2Vzc2lvbkNvbnRyb2wiOnsibWF4U2Vzc2lvbnMiOjEwMDAsInNlc3Npb25Db250cm9sRW5hYmxlZCI6dHJ1ZX0sImRlZmF1bHRVc2FnZVJ1bGVzIjp7Im1pbkxldmVsIjowLCJkaWdpdGFsT25seSI6ZmFsc2UsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.fOHrdSlUn2tEMGq9dzeW9oM_x0zTCN4bXvLss1PA7-U,eyJrY0lkcyI6WyJiMTNlNDVkMC0wMzI0LTQ2ZGQtODRkNS0zYjJkNjc5MmViMzQiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..oFKeKIrHEWZUgYzCXNsA_w.sUjV6JcA80TptH-qmy6vAuLRBVWX_omdwxengBIM7jJwz3O9K3hn2hz6of5iv1ZEQ_Jk6FCoVsuZMpJHkUxJVofjaSlTEd76K2htJBo0kBmwlxlcu_fBihBgvGY6v0GMwHYucVeTakhgwDWcrvuRtXL7v7B8yoPlgFXwhpkv0so.Rv_Hvo0gCqwnK7_kvriUmw',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Widevine', // "com.widevine.alpha"
			},
		},
	},

	{
		name: 'DASH - HEVC- 10mb Benchmark (Widevine)',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/scramble/hevc/hevc_benchmark/hevc_benchmark_10000000.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiNmFmMTU1ZDMtNGJlNy00YmEyLTgxZGYtZmE4ZTI0Y2YzOTViIl0sImNvbnRlbnRJZCI6ImExZmQ0ZDY5LTdmNDQtNDBmNC1hNGFkLTE1NzM1ZjFiY2VlZCIsInN0b3JhYmxlIjp0cnVlLCJlbmNyeXB0aW9uTWV0aG9kIjoiUkFXX0FFU18xMjhfQ1RSX0NFTkMiLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.tzL2KXixcgujj4sZ-ky5QBJn2osG9V7X9ecf0OzANFU,eyJrY0lkcyI6WyI2YWYxNTVkMy00YmU3LTRiYTItODFkZi1mYThlMjRjZjM5NWIiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..-6BqJgNuEwLQ_IUTdVITJA.X_wHkLBFzOHIIK8uTqnuHwNjRHcy1a0Oq8rA8eyhht8RB8nMYRE5_Spy2N-KKYA890V6OGCQ6GazBfC00izD7jcr_NDVdq8gUSK57DSd1csjq4rWiQHDJyIWaUa0_2auJiJgVW01YTWCs0ur2JSlVwLR7gmAQ_YtEmjMb4sWYvA.hDiffWrgsgBRCL5cV24sRw',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				type: 'Widevine', // "com.widevine.alpha"
			},
		},
	},
	{
		name: 'DASH - HEVC- 4K Benchmark (Widevine)',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/scramble/hevc/hevc_benchmark/hevc_benchmark.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiNmFmMTU1ZDMtNGJlNy00YmEyLTgxZGYtZmE4ZTI0Y2YzOTViIl0sImNvbnRlbnRJZCI6ImExZmQ0ZDY5LTdmNDQtNDBmNC1hNGFkLTE1NzM1ZjFiY2VlZCIsInN0b3JhYmxlIjp0cnVlLCJlbmNyeXB0aW9uTWV0aG9kIjoiUkFXX0FFU18xMjhfQ1RSX0NFTkMiLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.tzL2KXixcgujj4sZ-ky5QBJn2osG9V7X9ecf0OzANFU,eyJrY0lkcyI6WyI2YWYxNTVkMy00YmU3LTRiYTItODFkZi1mYThlMjRjZjM5NWIiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..-6BqJgNuEwLQ_IUTdVITJA.X_wHkLBFzOHIIK8uTqnuHwNjRHcy1a0Oq8rA8eyhht8RB8nMYRE5_Spy2N-KKYA890V6OGCQ6GazBfC00izD7jcr_NDVdq8gUSK57DSd1csjq4rWiQHDJyIWaUa0_2auJiJgVW01YTWCs0ur2JSlVwLR7gmAQ_YtEmjMb4sWYvA.hDiffWrgsgBRCL5cV24sRw',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				type: 'Widevine', // "com.widevine.alpha"
			},
		},
	},
	{
		name: 'Test Pic [OTT Live Clear UTC]',
		source: {
			src: 'https://livesim.dashif.org/livesim/utc_direct-head/testpic_2s/Manifest.mpd',
			type: 'application/dash+xml',
		},
	},

	{
		name: 'Test Pic2 [OTV Live, Clear, Single subtitle track]',
		source: {
			src: 'https://livesim.dashif.org/livesim/testpic_2s/Manifest_stpp.mpd', // Subtitle
			type: 'application/dash+xml',
		},
	},
	{
		name: 'https://cph-msl.akamaized.net/dash/live/2003285/test/manifest.mpd',
		source: {
			src: 'https://cph-msl.akamaized.net/dash/live/2003285/test/manifest.mpd',
			type: 'application/dash+xml',
		},
	},
	//Stream with sideloaded textTracks
	{
		name: 'Tears of Steel [Stream with sideloaded textTracks]',
		source: {
			src: 'https://replacemewithyourown.com/demo/content/cd_tears_of_steel_1080p/tears_of_steel.mpd',
			type: 'application/dash+xml',
			textTracks: [
				{
					url: 'https://replacemewithyourown.com/vod/hls3/scramble/SUBTITLES_TXT_SRT_tears_of_steel/subs/TOS-fr.srt',
					mimeType: 'application/x-subrip',
					language: 'fr',
				},
				{
					url: 'https://replacemewithyourown.com/vod/hls3/scramble/SUBTITLES_TXT_SRT_tears_of_steel/subs/TOS-de.srt',
					mimeType: 'application/x-subrip',
					language: 'de',
				},
				{
					url: 'https://replacemewithyourown.com/vod/hls3/scramble/SUBTITLES_TXT_SRT_tears_of_steel/subs/TOS-en.srt',
					mimeType: 'application/x-subrip',
					language: 'en',
				},
				{
					url: 'https://replacemewithyourown.com/vod/hls3/scramble/SUBTITLES_TXT_SRT_tears_of_steel/subs/TOS-es.srt',
					mimeType: 'application/x-subrip',
					language: 'es',
				},
			],
		},
	},

	{
		name: 'DASH - Long PlanetEarth (PlayReady) non-callback mode',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/scramble/planetearth-jungle_25fps_5mbps_4hr/planetearth-jungle_1.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMGMyOGYyNzEtMGI1Zi00MWRiLTk1NTItODJiMDBmYzYzZDZlIl0sImNvbnRlbnRJZCI6InBsYW5ldGVhcnRoLWp1bmdsZSIsInN0b3JhYmxlIjp0cnVlLCJlbmNyeXB0aW9uTWV0aG9kIjoiUkFXX0FFU18xMjhfQ1RSX0NFTkMiLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.csMCk4sGTntUGzJL-MkscgBWUz3tj8Vsr5EXJ4o38_U,eyJrY0lkcyI6WyIwYzI4ZjI3MS0wYjVmLTQxZGItOTU1Mi04MmIwMGZjNjNkNmUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..bLg-oHUm9H2vnaIRFYXWwg.9-iWXMN8btmgN0vzzNwLfkuguAsqa_c_K3_RSIkK-uFgpfDmazyZiufUBFERMR1-Jy2uqC_b_Zlot-l0v62vgp7fvPDqLIOoQEDwHBJ0lZvxK3DgyAWf6kV1RAJSDzvcR9zKOPNyRQ25r5I03vRTbU0BfbGkwV0M_nkQsYrtMwY.VCZhDtRypyPQWASFa_aXTA',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				type: 'Playready',
			},
		},
		callbackMode: false,
	},
	{
		name: 'DASH - Long PlanetEarth (Widevine) non-callback Mode',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/scramble/planetearth-jungle_25fps_5mbps_4hr/planetearth-jungle_1.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMGMyOGYyNzEtMGI1Zi00MWRiLTk1NTItODJiMDBmYzYzZDZlIl0sImNvbnRlbnRJZCI6InBsYW5ldGVhcnRoLWp1bmdsZSIsInN0b3JhYmxlIjp0cnVlLCJlbmNyeXB0aW9uTWV0aG9kIjoiUkFXX0FFU18xMjhfQ1RSX0NFTkMiLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.csMCk4sGTntUGzJL-MkscgBWUz3tj8Vsr5EXJ4o38_U,eyJrY0lkcyI6WyIwYzI4ZjI3MS0wYjVmLTQxZGItOTU1Mi04MmIwMGZjNjNkNmUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..bLg-oHUm9H2vnaIRFYXWwg.9-iWXMN8btmgN0vzzNwLfkuguAsqa_c_K3_RSIkK-uFgpfDmazyZiufUBFERMR1-Jy2uqC_b_Zlot-l0v62vgp7fvPDqLIOoQEDwHBJ0lZvxK3DgyAWf6kV1RAJSDzvcR9zKOPNyRQ25r5I03vRTbU0BfbGkwV0M_nkQsYrtMwY.VCZhDtRypyPQWASFa_aXTA',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				type: 'Widevine',
			},
		},
		callbackMode: false,
	},
	{
		name: 'DASH - Elephants Dream (PlayReady)',
		source: {
			src: 'https://replacemewithyourown.com/demo/content/ed_elephants_dream_1080p/elephants_dream.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMjc2NTM0Y2YtYTdhOC00ZDI5LWJkNjYtNGM1ZDgyYjIzMWM2Il0sImNvbnRlbnRJZCI6ImRhc2gtZGVtb19lbGVwaGFudHNfZHJlYW0iLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.WGB21Muz3OtFT_iUgAdhIwGphSrte434MdzqJwdiTNQ,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..LFvTs9vsg-EIEZyvtYZ3Rw.Qm5BoCqwRrlLNP7VIpNmTavwSJvLIFk_0g3R8mP_QFskEAQhW0Je9u-cFQKUzthIqoE3E7lHiqeLuAZcTtyD1v1XOQTjsHcXk1itRIUpaHY85Fkdmq8qX3GvUzgI13dogAJoD2yKA_v0oLEpfTS-HgLSAScaTUPz2JVON-c1XK4.satV1gwbeyKOR_7rEg9G3g',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				type: 'Playready',
			},
		},
	},
	{
		name: 'DASH - Elephants Dream (PlayReady) callback mode',
		source: {
			src: 'https://replacemewithyourown.com/demo/content/ed_elephants_dream_1080p/elephants_dream.mpd',
			type: 'application/dash+xml',
			// In callback mode, token and licenseURL are not passed .
			drm: {
				type: 'Playready',
			},
		},
		license: {
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMjc2NTM0Y2YtYTdhOC00ZDI5LWJkNjYtNGM1ZDgyYjIzMWM2Il0sImNvbnRlbnRJZCI6ImRhc2gtZGVtb19lbGVwaGFudHNfZHJlYW0iLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.WGB21Muz3OtFT_iUgAdhIwGphSrte434MdzqJwdiTNQ,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..LFvTs9vsg-EIEZyvtYZ3Rw.Qm5BoCqwRrlLNP7VIpNmTavwSJvLIFk_0g3R8mP_QFskEAQhW0Je9u-cFQKUzthIqoE3E7lHiqeLuAZcTtyD1v1XOQTjsHcXk1itRIUpaHY85Fkdmq8qX3GvUzgI13dogAJoD2yKA_v0oLEpfTS-HgLSAScaTUPz2JVON-c1XK4.satV1gwbeyKOR_7rEg9G3g',
			certificateURL: '',
			licenseURL:
				'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
		},
		callbackMode: true,
	},
	{
		name: 'DASH - Elephants Dream (Widevine)',
		source: {
			src: 'https://replacemewithyourown.com/demo/content/ed_elephants_dream_1080p/elephants_dream.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMjc2NTM0Y2YtYTdhOC00ZDI5LWJkNjYtNGM1ZDgyYjIzMWM2Il0sImNvbnRlbnRJZCI6ImRhc2gtZGVtb19lbGVwaGFudHNfZHJlYW0iLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.WGB21Muz3OtFT_iUgAdhIwGphSrte434MdzqJwdiTNQ,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..LFvTs9vsg-EIEZyvtYZ3Rw.Qm5BoCqwRrlLNP7VIpNmTavwSJvLIFk_0g3R8mP_QFskEAQhW0Je9u-cFQKUzthIqoE3E7lHiqeLuAZcTtyD1v1XOQTjsHcXk1itRIUpaHY85Fkdmq8qX3GvUzgI13dogAJoD2yKA_v0oLEpfTS-HgLSAScaTUPz2JVON-c1XK4.satV1gwbeyKOR_7rEg9G3g',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				type: 'Widevine',
			},
		},
	},
	{
		name: 'DASH - Elephants Dream (Widevine) Callback Mode',
		source: {
			src: 'https://replacemewithyourown.com/demo/content/ed_elephants_dream_1080p/elephants_dream.mpd',
			type: 'application/dash+xml',
			// In Callback mode token and license url is not passed
			drm: {
				type: 'Widevine',
			},
		},
		license: {
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMjc2NTM0Y2YtYTdhOC00ZDI5LWJkNjYtNGM1ZDgyYjIzMWM2Il0sImNvbnRlbnRJZCI6ImRhc2gtZGVtb19lbGVwaGFudHNfZHJlYW0iLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.WGB21Muz3OtFT_iUgAdhIwGphSrte434MdzqJwdiTNQ,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..LFvTs9vsg-EIEZyvtYZ3Rw.Qm5BoCqwRrlLNP7VIpNmTavwSJvLIFk_0g3R8mP_QFskEAQhW0Je9u-cFQKUzthIqoE3E7lHiqeLuAZcTtyD1v1XOQTjsHcXk1itRIUpaHY85Fkdmq8qX3GvUzgI13dogAJoD2yKA_v0oLEpfTS-HgLSAScaTUPz2JVON-c1XK4.satV1gwbeyKOR_7rEg9G3g',
			licenseURL:
				'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
		},
		callbackMode: true,
	},
	{
		name: 'DASH - Sintel (Playready)',
		source: {
			src: 'https://replacemewithyourown.com/demo/content/ed_sintel_1080p/sintel.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiNGRkNjcwZGYtYjg0OC00NzZiLWE4NjItNjMyMWM3YWU3ZmQ1Il0sImNvbnRlbnRJZCI6ImRhc2gtZGVtb19zaW50ZWxfNGsiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.RE5W1q44m5Po-gdcfrn7sK-CdFzrEq44KiFo0KK7Kx0,eyJrY0lkcyI6WyI0ZGQ2NzBkZi1iODQ4LTQ3NmItYTg2Mi02MzIxYzdhZTdmZDUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..G9PbDGQNz8VOX7NXoePFtQ.eDmP659_5ZQHfCxjrwD5lCiiP1oZqxp3dQKWx1sMpeAau1cJKFl9QuO3Iy-1N9_SzLB3SmCVoQCGWVF9obv5np-RU5nsZshCODtfVI4RqFZNSk5_31sGcFOQAe5qxNYrzQ0auCr9gfNNCZDYuqgLAHPXQMWOGkxf9cxNKHI3Ook.Po0ergXEvtoq35Tss0tNRQ',
			type: 'application/dash+xml',

			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				type: 'Playready',
			},
			thumbnailUrl:
				'https://replacemewithyourown.com/demo/content/ed_sintel_1080p/aux_files/SD/web.vtt',
		},
	},
	{
		name: 'DASH - Sintel (Widevine)',
		source: {
			src: 'https://replacemewithyourown.com/demo/content/ed_sintel_1080p/sintel.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiNGRkNjcwZGYtYjg0OC00NzZiLWE4NjItNjMyMWM3YWU3ZmQ1Il0sImNvbnRlbnRJZCI6ImRhc2gtZGVtb19zaW50ZWxfNGsiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.RE5W1q44m5Po-gdcfrn7sK-CdFzrEq44KiFo0KK7Kx0,eyJrY0lkcyI6WyI0ZGQ2NzBkZi1iODQ4LTQ3NmItYTg2Mi02MzIxYzdhZTdmZDUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..G9PbDGQNz8VOX7NXoePFtQ.eDmP659_5ZQHfCxjrwD5lCiiP1oZqxp3dQKWx1sMpeAau1cJKFl9QuO3Iy-1N9_SzLB3SmCVoQCGWVF9obv5np-RU5nsZshCODtfVI4RqFZNSk5_31sGcFOQAe5qxNYrzQ0auCr9gfNNCZDYuqgLAHPXQMWOGkxf9cxNKHI3Ook.Po0ergXEvtoq35Tss0tNRQ',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				type: 'Widevine',
			},
			thumbnailUrl:
				'https://replacemewithyourown.com/demo/content/ed_sintel_1080p/aux_files/SD/web.vtt',
		},
	},
	{
		name: 'Advanced Stream',
		source: {
			src: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
			type: 'application/x-mpegURL',
		},
	},
	{
		name: 'Apple Basic Stream 16x9 with MA',
		source: {
			src: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
			type: 'application/x-mpegURL',
		},
	},
	{
		name: 'Elephants dream 24fps fmp4 Fairplay non-callback mode',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls6/scramble/elephants_dream_24fps_fmp4_fps_scramble/master-ssp.m3u8',
			type: 'application/x-mpegURL',
			token: 'eyJraWQiOiI2MTgyMzgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaW9zMiJ9LCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJzZXNzaW9uQ29udHJvbCI6eyJtYXhTZXNzaW9ucyI6Miwic2Vzc2lvbkNvbnRyb2xFbmFibGVkIjp0cnVlfSwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5Ijp0cnVlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.MOD-K1dmvPJzyFxt0JlH5LYmY636bjnuNc9wkf4TKVY',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
				certificateURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Fairplay',
			},
		},
		callbackMode: false,
	},
	{
		name: 'SSP-Encrypted-TearsOfSteel callback mode',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls5/scramble/TOS_1080p_24fps_ts_encrypted_fairplay/master-ssp.m3u8',
			type: 'application/x-mpegURL',
			drm: {
				type: 'Fairplay',
			},
		},
		license: {
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.ch1hZliH8J4qVeGcgGJFUFJqc4DxJ4iP_xGczf9yqHA',
			licenseURL:
				'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
			certificateURL:
				'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
		},
		callbackMode: true,
	},
	{
		name: 'SSP-Encrypted-TearsOfSteel',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls5/scramble/TOS_1080p_24fps_ts_encrypted_fairplay/master-ssp.m3u8',
			type: 'application/x-mpegURL',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
				certificateURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
				type: 'Fairplay',
			},
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.ch1hZliH8J4qVeGcgGJFUFJqc4DxJ4iP_xGczf9yqHA',
		},
	},
	{
		name: 'SSP Doctors',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls5/scramble/doctors_smpte-tt-id3-png_subtitles_fairplay/index-ssp.m3u8',
			type: 'application/x-mpegURL',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
				certificateURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
				type: 'Fairplay',
			},
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.ch1hZliH8J4qVeGcgGJFUFJqc4DxJ4iP_xGczf9yqHA',
		},
	},
	{
		name: 'SSP Multi Subtitle',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls5/scramble/screenID3_png_multi-subtitle_fairplay_encrypted/index-ssp.m3u8',
			type: 'application/x-mpegURL',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
				certificateURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
				type: 'Fairplay',
			},
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.ch1hZliH8J4qVeGcgGJFUFJqc4DxJ4iP_xGczf9yqHA',
		},
	},
	{
		name: 'HLS SSP FPS Elephants Dream TS',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls5/scramble/elephants_dream_24fps_hls_ts_fps_scramble/master-ssp.m3u8',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.ch1hZliH8J4qVeGcgGJFUFJqc4DxJ4iP_xGczf9yqHA',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
				certificateURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
				type: 'Fairplay',
			},
			chapterUrl:
				'https://replacemewithyourown.com/demo/content/cd_elephants_dream_1080p/aux_files/chapters_en.vtt',
			thumbnailUrl:
				'https://replacemewithyourown.com/demo/content/ed_elephants_dream_1080p/aux_files/SD/web.vtt',
			type: 'application/x-mpegURL',
		},
	},
	{
		name: '[Fairplay] 404 Error Code test',
		source: {
			src: 'https://d3bqrzf9w11pn3.cloudfront.net/basic_dash_bbb_clear/intentionallyMissingExpectAnError.m3u8',
			type: 'application/x-mpegURL',
		},
	},
	{
		name: 'DASH - LIVE: BBC1',
		source: {
			src: 'https://replacemewithyourown.com/secureplayer/live-pmxo/Content/dash/Live/Channel(bbc1)/manifest.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'Dash Clear Webvtt in MP4 Container',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/clear/google/shaka-demo-assets/angel-one/dash.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DimSum Subtitles lack of styling',
		source: {
			src: 'https://replacemewithyourown.com/vod/customers/starhub/GLOBAL_CT0000006822/manifest.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH - Tears of Steel (Widevine)',
		source: {
			src: 'https://replacemewithyourown.com/demo/content/ed_tears_of_steel_1080p/tears_of_steel.mpd',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				type: 'Widevine',
			},
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiODNkZmVjYzQtOTVjYy00Y2E1LWE3NzMtNjI4OGU0MjgyMTg3Il0sImNvbnRlbnRJZCI6ImRhc2gtZGVtb190ZWFyc19vZl9zdGVlbCIsInN0b3JhYmxlIjp0cnVlLCJlbmNyeXB0aW9uTWV0aG9kIjoiUkFXX0FFU18xMjhfQ1RSX0NFTkMiLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.Kt70g3o7RLTY0U1rVczJBdBHBNjYENDEavZWMCAfmq0,eyJrY0lkcyI6WyI4M2RmZWNjNC05NWNjLTRjYTUtYTc3My02Mjg4ZTQyODIxODciXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..78fa4ccT45hA8f_sf8PNyw.7oq9gfOfabFuZVuuCPfO8PMHeFvgHlcvLZqz7pYk2J2mISUyfz2m3JZG4LFrvK1gPFotIlJ6ImVtUu2_dlYrp3OIZGLNw5Yv1Pupw1xjXyippOUuNy7cyVe5xNfrdN3Th9Tfl6qCDYT3J5mqDlHof1K5w3MRyQ0kP3dJ38o8G6Q.7oToQZb5X6RZcS2qA6AbJQ',
			thumbnailUrl:
				'https://replacemewithyourown.com/demo/content/ed_tears_of_steel_1080p/aux_files/SD/web.vtt',
		},
	},
	{
		name: 'DASH - Tears of Steel (PlayReady)',
		source: {
			src: 'https://replacemewithyourown.com/demo/content/ed_tears_of_steel_1080p/tears_of_steel.mpd',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				type: 'Playready',
			},
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiODNkZmVjYzQtOTVjYy00Y2E1LWE3NzMtNjI4OGU0MjgyMTg3Il0sImNvbnRlbnRJZCI6ImRhc2gtZGVtb190ZWFyc19vZl9zdGVlbCIsInN0b3JhYmxlIjp0cnVlLCJlbmNyeXB0aW9uTWV0aG9kIjoiUkFXX0FFU18xMjhfQ1RSX0NFTkMiLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.Kt70g3o7RLTY0U1rVczJBdBHBNjYENDEavZWMCAfmq0,eyJrY0lkcyI6WyI4M2RmZWNjNC05NWNjLTRjYTUtYTc3My02Mjg4ZTQyODIxODciXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..78fa4ccT45hA8f_sf8PNyw.7oq9gfOfabFuZVuuCPfO8PMHeFvgHlcvLZqz7pYk2J2mISUyfz2m3JZG4LFrvK1gPFotIlJ6ImVtUu2_dlYrp3OIZGLNw5Yv1Pupw1xjXyippOUuNy7cyVe5xNfrdN3Th9Tfl6qCDYT3J5mqDlHof1K5w3MRyQ0kP3dJ38o8G6Q.7oToQZb5X6RZcS2qA6AbJQ',
			thumbnailUrl:
				'https://replacemewithyourown.com/demo/content/ed_tears_of_steel_1080p/aux_files/SD/web.vtt',
		},
	},
	{
		name: 'DASH - Tears of Steel - Thumbnails(Clear)',
		source: {
			src: 'https://replacemewithyourown.com/demo/content/cd_tears_of_steel_1080p/tears_of_steel.mpd',
			type: 'application/dash+xml',
			thumbnailUrl:
				'https://replacemewithyourown.com/demo/content/cd_tears_of_steel_1080p/aux_files/SD/web.vtt',
		},
	},
	{
		name: 'DASH Sintel_track_kinds_text_captions-subtitles',
		source: {
			type: 'application/dash+xml',
			src: 'https://replacemewithyourown.com/vod/demo_content/vspace/public/dash/ma_ms_dash_sintel_clear/sintel_track_kinds_text_captions-subtitles.mpd',
		},
	},
	{
		name: 'DASH Sintel_track_kinds_text_descriptions',
		source: {
			type: 'application/dash+xml',
			src: 'https://replacemewithyourown.com/vod/demo_content/vspace/public/dash/ma_ms_dash_sintel_clear/sintel_track_kinds_text_descriptions.mpd',
		},
	},
	{
		name: 'DASH Sintel_track_kinds_audio_translation',
		source: {
			type: 'application/dash+xml',
			src: 'https://replacemewithyourown.com/vod/demo_content/vspace/public/dash/ma_ms_dash_sintel_clear/sintel_track_kinds_audio_translation.mpd',
		},
	},
	{
		name: 'DASH Sintel_track_kinds_audio_main-des',
		source: {
			type: 'application/dash+xml',
			src: 'https://replacemewithyourown.com/vod/demo_content/vspace/public/dash/ma_ms_dash_sintel_clear/sintel_track_kinds_audio_main-desc.mpd',
		},
	},
	{
		name: 'DASH-BBC-EBU-TT-D-subtitle-(Fragmented)',
		source: {
			type: 'application/dash+xml',
			src: 'https://replacemewithyourown.com/vod/dash/clear/bbc/bbc_ebu-tt-d_subtitle_fragmented/dash/ondemand/elephants_dream/1/client_manifest-all-minus-1080p.mpd',
		},
	},
	{
		name: 'DASH-SMPTE-TT-BBC-segmented-snaking-subtitle',
		source: {
			type: 'application/dash+xml',
			src: 'https://replacemewithyourown.com/vod/dash/clear/bbc/bbc_segmented_snaking_subtitle/dash/ondemand/elephants_dream/1/client_manifest-snake-minus-1080p.mpd',
		},
	},
	{
		name: 'DASH-SMPTE-TT-IMSC1-support',
		source: {
			type: 'application/dash+xml',
			src: 'https://replacemewithyourown.com/vod/dash/clear/DASHIFREF/dash.akamaized.net/dash264/CTA/imsc1/IT1-20171027_dash.mpd',
		},
	},
	{
		name: 'DASH-SMPTE-TT-TTML-Segmented-Subtitles-VoD',
		source: {
			type: 'application/dash+xml',
			src: 'https://replacemewithyourown.com/vod/dash/dash-if_livesim/dashif-livesim_2019-01-24/vod/testpic_2s/multi_subs.mpd',
		},
	},
	{
		name: 'DASH-SMPTE-TT-TTML-Segmented-Subtitles-live',
		source: {
			src: 'https://replacemewithyourown.com/livesim/testpic_2s/multi_subs.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH-SMPTE-TT-IMS-image-fragmented-subtitle',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/dash-if_livesim/dashif-livesim_2019-01-24/vod/testpic_2s/imsc1_img.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH-SMPTE-TT-TTML-subtitle-xml-text',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/dash-if_livesim/dashif-livesim_2019-01-24/vod/testpic_2s/xml_subs.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH-SMPTE-TT-TTML-subtitle-xml-image',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/dash-if_livesim/dashif-livesim_2019-01-24/vod/testpic_2s/img_subs.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH Aspect Ratio 47:20',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/clear/aspect_ratio/DAR-47x20_SAR-1x1_clear/manifest.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH Aspect Ratio 37:20',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/clear/aspect_ratio/DAR-37x20_SAR-1x1_clear/manifest.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH Aspect Ratio 16:9',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/clear/aspect_ratio/DAR-16x9_SAR-1x1_clear/manifest.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH Aspect Ratio 11:5',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/clear/aspect_ratio/DAR-11x5_SAR-1x1_clear/manifest.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH Aspect Ratio 5:4',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/clear/aspect_ratio/DAR-5x4_SAR-1x1_clear/manifest.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH Aspect Ratio 4:3',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/clear/aspect_ratio/DAR-4x3_SAR-1x1_clear/manifest.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH Aspect Ratio 4:3 to 16:9',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/clear/aspect_ratio/aspect-switch_4x3to16x9/manifest.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH - Universe Fury (Dolby Atmos)',
		source: {
			src: 'https://d3rlna7iyyu8wu.cloudfront.net/Atmos/DASH/universe_fury_DASH/Universe_Fury_10000000.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH - Shattered (Dolby Atmos)',
		source: {
			src: 'https://d3rlna7iyyu8wu.cloudfront.net/Atmos/DASH/dolby_shattered_DASH/Shattered_10000000.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'DASH Claro Colombia BARKER',
		source: {
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				type: 'Widevine',
			},
			type: 'application/dash+xml',
			src: 'https://nagracovoslive.lcdn.claro.net.co/Content/DASH_DASH_NAGRA/Live/Channel(BARKER)/manifest.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiIzMDEwNCIsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInVzYWdlUnVsZXNQcm9maWxlSWQiOiJUZXN0In1dfQ.iwx9Acn8Gwvgyf2FsoOQxkJRTZqnMiw6H9wEb0EW7eY',
		},
	},
	{
		name: 'DASH Claro Colombia HBO multi-audio subtitles',
		source: {
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				type: 'Widevine',
			},
			type: 'application/dash+xml',
			src: 'https://nagracovoslive.lcdn.claro.net.co/Content/DASH_DASH_NAGRA/Live/Channel(HBO_HD)/manifest.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiIzMDA5NCIsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInVzYWdlUnVsZXNQcm9maWxlSWQiOiJUZXN0In1dfQ.B-FA9uIl0clQwIyB0S5EvzHq4nRGxU1S-M81_FKONnI',
		},
	},
	{
		name: '404 Error Code test',
		source: {
			src: 'https://replacemewithyourown.com/thisUrlDoesNotExist.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'Bad URL Not Found test',
		source: {
			src: 'https://replacemewithyourown.com/path/to/oblivion.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'Host Not Found test',
		source: {
			src: 'http://duff.site.com/path/to/oblivion.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'Forbidden test',
		source: {
			src: 'https://replacemewithyourown.com/vod/test403.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'Corrupt manifest test',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/clear/TestCases/1b/envivio/corrupt_manifest.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'Unsupported manifest test',
		source: {
			src: 'https://replacemewithyourown.com/secureplayer/live-vos/Content/DASH/Live/channel(bbc1)/manifest.mpd',
			type: 'application/dash+xml',
		},
	},
	{
		name: 'SSM 404',
		source: {
			src: 'https://nagracovoslive.lcdn.claro.net.co/Content/DASH_DASH_NAGRA/Live/Channel(EUROCHANNEL)/manifest.mpd',
			type: 'application/dash+xml',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDIifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjI3NjUzNGNmLWE3YTgtNGQyOS1iZDY2LTRjNWQ4MmIyMzFjNiJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fZWxlcGhhbnRzX2RyZWFtIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoyLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.dc6BDhjx7ML676ePQJWo1I2M2cd7rRmHItXUQsw91Rs,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..WK6rp-4982ktRUV6C9qYew.WlaXWAEUfI3yID9XILCOc-u7NRqIglsQaMac7lD2-cVVDZLGVRf80XooDbiq9m97ZxUrvo1UBnwKYSNnmgpzw9X4BxCI-P4dAoswsFwgLBjbzpXs4le4kBE3R-ZI_GdNqeqL3h3Lu3O7uYuXAkssY920vdyuIMNgh6XuGz3LFpE.F5_b_NX6e5C7OF-S2FJtrQ',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Widevine',
			},
		},
	},
	{
		name: 'Multi Track Content',
		source: {
			src: 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
			type: 'application/dash+xml',
		},
	},
];

const unFilteredSourceListEncryptedSSM = [
	{
		name: 'VOD Encrypted DASH - playready-ssm - 2 sessions',
		source: {
			src: 'https://replacemewithyourown.com/vod/demo_content/ed_elephants_dream_1080p/elephants_dream_mspr_only.mpd?SSM1000 Elephants Dream',
			token:
				// 2 concurrent sessions allowed
				'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDIifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjI3NjUzNGNmLWE3YTgtNGQyOS1iZDY2LTRjNWQ4MmIyMzFjNiJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fZWxlcGhhbnRzX2RyZWFtIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoyLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.dc6BDhjx7ML676ePQJWo1I2M2cd7rRmHItXUQsw91Rs,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..WK6rp-4982ktRUV6C9qYew.WlaXWAEUfI3yID9XILCOc-u7NRqIglsQaMac7lD2-cVVDZLGVRf80XooDbiq9m97ZxUrvo1UBnwKYSNnmgpzw9X4BxCI-P4dAoswsFwgLBjbzpXs4le4kBE3R-ZI_GdNqeqL3h3Lu3O7uYuXAkssY920vdyuIMNgh6XuGz3LFpE.F5_b_NX6e5C7OF-S2FJtrQ',
			// 1000 concurrent sessions allowed
			// "eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjI3NjUzNGNmLWE3YTgtNGQyOS1iZDY2LTRjNWQ4MmIyMzFjNiJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fZWxlcGhhbnRzX2RyZWFtIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoxMDAwLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.0FeOB-v1BV1x-83UiSdENE9KvXyhDTsnzlBULvpzEx4,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..RCHnPaz4bZvIB06dpy1kSA.QPc3b263SoSdUH4kNjEKyXbQca4Qqus_2o9vLFBw3paifKSxpNlwTGnCHG8-cKhzuOeuY0CZJAk3RGkpu45hYNwFOBxwO-rRF_689W7hA0bUv66-Vp6PZWTHPL-y0AP3sQtrbWWED8rlyUxNiw1H71AkmFac5LG4fNjxW_nTwPo.C9Mm75b9uODSqignN2FG1Q"
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Playready',
			},
		},
	},
	{
		// enforcement
		name: 'VOD Encrypted DASH - playready-ssm - 1000 sessions',
		source: {
			src: 'https://replacemewithyourown.com/vod/demo_content/ed_elephants_dream_1080p/elephants_dream_mspr_only.mpd?SSM1000 Elephants Dream',
			token:
				// 1000 concurrent sessions allowed
				'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjI3NjUzNGNmLWE3YTgtNGQyOS1iZDY2LTRjNWQ4MmIyMzFjNiJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fZWxlcGhhbnRzX2RyZWFtIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoxMDAwLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.0FeOB-v1BV1x-83UiSdENE9KvXyhDTsnzlBULvpzEx4,eyJrY0lkcyI6WyIyNzY1MzRjZi1hN2E4LTRkMjktYmQ2Ni00YzVkODJiMjMxYzYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..RCHnPaz4bZvIB06dpy1kSA.QPc3b263SoSdUH4kNjEKyXbQca4Qqus_2o9vLFBw3paifKSxpNlwTGnCHG8-cKhzuOeuY0CZJAk3RGkpu45hYNwFOBxwO-rRF_689W7hA0bUv66-Vp6PZWTHPL-y0AP3sQtrbWWED8rlyUxNiw1H71AkmFac5LG4fNjxW_nTwPo.C9Mm75b9uODSqignN2FG1Q',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Playready',
			},
		},
	},
	{
		name: 'Big Buck Bunny SSM 2 sessions Playready',
		source: {
			src: 'https://replacemewithyourown.com/vod/demo_content/ed_big_buck_bunny_1080p/big_buck_bunny.mpd?SSM2Big Buck Bunny',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDIifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbImIxM2U0NWQwLTAzMjQtNDZkZC04NGQ1LTNiMmQ2NzkyZWIzNCJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fYmlnX2J1Y2tfYnVubnkiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwic2Vzc2lvbkNvbnRyb2wiOnsibWF4U2Vzc2lvbnMiOjIsInNlc3Npb25Db250cm9sRW5hYmxlZCI6dHJ1ZX0sImRlZmF1bHRVc2FnZVJ1bGVzIjp7Im1pbkxldmVsIjowLCJkaWdpdGFsT25seSI6ZmFsc2UsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.EdjPin2AY1_D7udM8VOyNIDcC1MCAXWStugUSeBDoyg,eyJrY0lkcyI6WyJiMTNlNDVkMC0wMzI0LTQ2ZGQtODRkNS0zYjJkNjc5MmViMzQiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..x3bIys_9_lIRdkP-8gSK0g.boVD_zcRzEzZ5TGWA4iMVGu_4BqIYY3PafJ3DMTnC-zKJYOOzwN_Jv6Duwq7ihiW3uMwvSwDj1jYjKtugS2RLYffe4XrCpr7QE6dYkJUc037qyf12apeCKLladZFqP511GHAbBxS8U6ry7LNH8kkBbEegx0ZoxddmYbf11HLVqU.M1FFvzweln0JzAMJNQBf3w',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Playready',
			},
		},
		contentId: '',
	},
	{
		name: 'Big Buck Bunny SSM 1000 sessions Playready',
		source: {
			src: 'https://replacemewithyourown.com/vod/demo_content/ed_big_buck_bunny_1080p/big_buck_bunny.mpd?SSM1KBig Buck Bunny',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbImIxM2U0NWQwLTAzMjQtNDZkZC04NGQ1LTNiMmQ2NzkyZWIzNCJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fYmlnX2J1Y2tfYnVubnkiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwic2Vzc2lvbkNvbnRyb2wiOnsibWF4U2Vzc2lvbnMiOjEwMDAsInNlc3Npb25Db250cm9sRW5hYmxlZCI6dHJ1ZX0sImRlZmF1bHRVc2FnZVJ1bGVzIjp7Im1pbkxldmVsIjowLCJkaWdpdGFsT25seSI6ZmFsc2UsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.fOHrdSlUn2tEMGq9dzeW9oM_x0zTCN4bXvLss1PA7-U,eyJrY0lkcyI6WyJiMTNlNDVkMC0wMzI0LTQ2ZGQtODRkNS0zYjJkNjc5MmViMzQiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..oFKeKIrHEWZUgYzCXNsA_w.sUjV6JcA80TptH-qmy6vAuLRBVWX_omdwxengBIM7jJwz3O9K3hn2hz6of5iv1ZEQ_Jk6FCoVsuZMpJHkUxJVofjaSlTEd76K2htJBo0kBmwlxlcu_fBihBgvGY6v0GMwHYucVeTakhgwDWcrvuRtXL7v7B8yoPlgFXwhpkv0so.Rv_Hvo0gCqwnK7_kvriUmw',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Playready',
			},
		},
		contentId: '',
	},
	{
		name: 'Sintel SSM 2 sessions',
		source: {
			src: 'https://replacemewithyourown.com/vod/demo_content/ed_sintel_1080p/sintel.mpd?SSM2 Sintel',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDIifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjRkZDY3MGRmLWI4NDgtNDc2Yi1hODYyLTYzMjFjN2FlN2ZkNSJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fc2ludGVsXzRrIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoyLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.bEhqRVwFfpL_K4-kSKFMP1zP-eaIECx5Du9h-03_bXE,eyJrY0lkcyI6WyI0ZGQ2NzBkZi1iODQ4LTQ3NmItYTg2Mi02MzIxYzdhZTdmZDUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..46yu0h7UU8uehnpEG7VM7Q.EU4QQKgbXYV0zGnGP5tz1KYEVlgTq9_nMD-2hr123zsRWkmLBHeormz1s_b_FSCa6tgMmzmtyXp-ecOCv1lCb3R2F0UFZf6owNYI3G5TuU-ExcrmCrogydK3dadBF8J0LfJi6ICcHB67VIUSpvyKcUfngqQxNHzZ2iPwCslNT_k.DTplXaxH2dio3hWn_eu_NA',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Playready',
			},
		},
		contentId: '',
		thumbnailUrl:
			'https://replacemewithyourown.com/vod/demo_content/ed_sintel_1080p/aux_files/SD/web.vtt',
		chapterUrl:
			'https://replacemewithyourown.com/vod/demo_content/ed_sintel_1080p/aux_files/chapters_en.vtt',
	},
	{
		name: 'Sintel SSM 1000 sessions',
		source: {
			src: 'https://replacemewithyourown.com/vod/demo_content/ed_sintel_1080p/sintel.mpd?SSM1000 Sintel',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjRkZDY3MGRmLWI4NDgtNDc2Yi1hODYyLTYzMjFjN2FlN2ZkNSJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fc2ludGVsXzRrIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoxMDAwLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.O6P_W5MDtppchgtDcjRf6lGtvndg8qYI0SvX5AsTSNw,eyJrY0lkcyI6WyI0ZGQ2NzBkZi1iODQ4LTQ3NmItYTg2Mi02MzIxYzdhZTdmZDUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..FnAMFZvETeg0qSeT4dIkHg.vxvzTz9qm0i2dyz61E0f7Bx342m-jUF65YdmXbFPir27_bMdHgYOuMPDK8zG9rXivMBjMfJ0zhTuOAFgZS1hWWmPM_dGih8aO1LBxcNLF46oamrkhvlg7AweyNFi66jYt3Pg_X2zfoH-8hScHqtSNA3I4xy1pQhZHT5GdaQZj-c.Ml7dqvscUJKPJRDuwOuHXg',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Playready',
			},
		},
		contentId: '',
		thumbnailUrl:
			'https://replacemewithyourown.com/vod/demo_content/ed_sintel_1080p/aux_files/SD/web.vtt',
		chapterUrl:
			'https://replacemewithyourown.com/vod/demo_content/ed_sintel_1080p/aux_files/chapters_en.vtt',
	},
	{
		name: 'Tears of Steel SSM 2 sessions',
		source: {
			src: 'https://replacemewithyourown.com/vod/demo_content/ed_tears_of_steel_1080p/tears_of_steel.mpd?SSM2 Tears',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDIifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjgzZGZlY2M0LTk1Y2MtNGNhNS1hNzczLTYyODhlNDI4MjE4NyJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fdGVhcnNfb2Zfc3RlZWwiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwic2Vzc2lvbkNvbnRyb2wiOnsibWF4U2Vzc2lvbnMiOjIsInNlc3Npb25Db250cm9sRW5hYmxlZCI6dHJ1ZX0sImRlZmF1bHRVc2FnZVJ1bGVzIjp7Im1pbkxldmVsIjowLCJkaWdpdGFsT25seSI6ZmFsc2UsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.O-S0luOJH_OtvZIDDQ7-q6TzZ-3xDYVKXMTCHFDjMII,eyJrY0lkcyI6WyI4M2RmZWNjNC05NWNjLTRjYTUtYTc3My02Mjg4ZTQyODIxODciXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..L9ekPQtPg1OGUEnZtvwnbg.6xBhcL3YsB9mPDjig848IUG4Lcg4D9TistoUtP8JQoXwWjSOmaoXE5ZHU5Dk5HOJzVxDhwYC8Uw7M2Z-wgj-JbsFyDbaAKdtNUaTkrr-pm5PL-FCl2eQ0YCatrNEIGQaag6UAMRQdYZcacA751GgyePOtzRGdAiVRkdOKF0cVqE.1C_d9d8jjJwYUjZPA2Rk4A',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Playready',
			},
		},
		contentId: '',
		thumbnailUrl:
			'https://replacemewithyourown.com/vod/demo_content/ed_tears_of_steel_1080p/aux_files/SD/web.vtt',
	},
	{
		name: 'Tears of Steel SSM 1000 sessions',
		source: {
			src: 'https://replacemewithyourown.com/vod/demo_content/ed_tears_of_steel_1080p/tears_of_steel.mpd?SSM1000 Tears',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaHRtbDEwMDAifSwiY29udGVudFJpZ2h0cyI6W3siZGVmYXVsdEtjSWRzIjpbIjgzZGZlY2M0LTk1Y2MtNGNhNS1hNzczLTYyODhlNDI4MjE4NyJdLCJjb250ZW50SWQiOiJkYXNoLWRlbW9fdGVhcnNfb2Zfc3RlZWwiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwic2Vzc2lvbkNvbnRyb2wiOnsibWF4U2Vzc2lvbnMiOjEwMDAsInNlc3Npb25Db250cm9sRW5hYmxlZCI6dHJ1ZX0sImRlZmF1bHRVc2FnZVJ1bGVzIjp7Im1pbkxldmVsIjowLCJkaWdpdGFsT25seSI6ZmFsc2UsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.9XPPLWJDtrdVcZnpvmC9TmSS8Vrtw4w8G3qqJnNqKxI,eyJrY0lkcyI6WyI4M2RmZWNjNC05NWNjLTRjYTUtYTc3My02Mjg4ZTQyODIxODciXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..Y8ng6jE6tZj66rqiL4BuAA.q9OM8bs5UzqPD5_f_fDjGLo2SqAEf80pAKxsf_Voy5ruc8W4aET5VzgmdNXHtImlDdE7IkZsiFtrAT0N10bzOlQRCbiBQBu1SIHF6-5PaDv54eT_mrmljY1tY9oIZHXdOEr5vGrvrwD5KFMEm8hJyQiJuefy7pNFG0zKdTdGyok.2ZXHuKpHmhTSg-bRn0eHYQ',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Playready',
			},
		},
		contentId: '',
		thumbnailUrl:
			'https://replacemewithyourown.com/vod/demo_content/ed_tears_of_steel_1080p/aux_files/SD/web.vtt',
	},
	// OTT VOD Encrypted DASH - playready
	{
		name: 'VOD Encrypted DASH - playready',
		source: {
			src: 'https://replacemewithyourown.com/demo/content/ed_big_buck_bunny_1080p/big_buck_bunny_mspr_only.mpd',
			type: 'application/dash+xml',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiYjEzZTQ1ZDAtMDMyNC00NmRkLTg0ZDUtM2IyZDY3OTJlYjM0Il0sImNvbnRlbnRJZCI6ImRhc2gtZGVtb19iaWdfYnVja19idW5ueSIsInN0b3JhYmxlIjp0cnVlLCJlbmNyeXB0aW9uTWV0aG9kIjoiUkFXX0FFU18xMjhfQ1RSX0NFTkMiLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.y_9bfJBdxwd2xolcCQF--H5bxkek1eGsHx5MyeFP-UQ,eyJrY0lkcyI6WyJiMTNlNDVkMC0wMzI0LTQ2ZGQtODRkNS0zYjJkNjc5MmViMzQiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..JE9rEEvVi4iF-a0de4RITg.P46F9UYoN-XYbJpJkyL6Ez1UdPF07o5PaJxnxbToeKBCt3WHWqzn89IVVELuPbcUAO5GaMOWfmM4ezOYTsDhXHVFBOEMkpQ-zu2UO7tpd9zZWUX782Rjo7R3SIsj080phEjAhgv2H2csc6KZ-CdhuEFyGjJ0X374QDOwt4j022w.a4Ez0wtLapmDozv-EufgTA',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				type: 'Playready',
			},
		},
	},
	// OTT VOD Encrypted DASH - Widevine
	{
		name: 'VOD Encrypted DASH - Widevine',
		source: {
			src: 'https://d3bqrzf9w11pn3.cloudfront.net/basic_dash_bbb_encrypted/bbb_public.mpd',
			type: 'application/dash+xml',
			token: 'eyJraWQiOiI4MTI0MjUiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkdXJhdGlvbiI6NzIwMCwiZGVmYXVsdEtjSWRzIjpbIjAyMDgxMTNlLWU2ZTgtNDI0Mi04NjdjLWQ5NjNmNWQ3ODkyMyJdLCJjb250ZW50SWQiOiI0NjgyZjFkNi05ODIwLTQwNmEtOWJhMC03YzAzZGJjZjE5NmMiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsIndhdGVybWFya2luZ0VuYWJsZWQiOnRydWUsImltYWdlQ29uc3RyYWludCI6dHJ1ZSwiaGRjcFR5cGUiOiJUWVBFXzEiLCJ1bmNvbXByZXNzZWREaWdpdGFsQ2FwcGluZ1Jlc29sdXRpb24iOiJOT19SRVNUUklDVElPTlMiLCJ1bnByb3RlY3RlZEFuYWxvZ091dHB1dCI6dHJ1ZSwiYW5hbG9nQ2FwcGluZ1Jlc29sdXRpb24iOiJOT19SRVNUUklDVElPTlMiLCJoZGNwIjp0cnVlLCJkZXZpY2VDYXBwaW5nUmVzb2x1dGlvbiI6Ik5PX1JFU1RSSUNUSU9OUyIsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.fZpotjTjiddueE_nPVcON0FnJwBO4FecTcYIoMmocnw,eyJrY0lkcyI6WyIwMjA4MTEzZS1lNmU4LTQyNDItODY3Yy1kOTYzZjVkNzg5MjMiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjgxMjQyNSJ9..ntJUOAc-g8sXrGLjZhx-MQ.nHnm-aciNeCz6kwUZEjOQgg-1PsLN1Uc8eYihUv_OUK8EaBoFH7JcdIyB9igEFfR9Cufau_5H-EvTdrmws20_ViWKjUTOZmUn7xPQOmwSftb99-rgd3g4QZO0quHIDB5qiBoKmksts8qDbcMZbr_aKMFIOlzNUUcBwiOvmrGyzo.-zTh5sY7tmbe7Ow94EQT9A',
			drm: {
				licenseURL:
					'https://vsd02fy1.anycast.nagra.com/VSD02FY1/wvls/contentlicenseservice/v1/licenses',
				type: 'Widevine', // "com.widevine.alpha"
			},
		},
	},
	// OTT VOD Encrypted DASH - TVkey
	{
		name: 'VOD Encrypted DASH - TVKey(TVKCLOUD)',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/scramble/bbb_prm_cenc_mpd/dash/connect-manifest-prm-pssh.mpd',
			type: 'application/dash+xml',
			token: 'eyJraWQiOiI1ODc2OTAiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMmU0NGE1YTItMjgyNy00MTllLThjZDktY2U0MzY3YmNkMTA2Il0sImNvbnRlbnRJZCI6IjBmMTFmOTUwLWQ5N2UtMTFlYi1iOGJjLTAyNDJhYzEzMDAwMyIsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsInVzYWdlUnVsZXNQcm9maWxlSWQiOiJUZXN0In1dfQ.tur1maSbIXKUkAs0lkCVePvRu_MUB28n_KfO93-6uwI,eyJrY0lkcyI6WyIyZTQ0YTVhMi0yODI3LTQxOWUtOGNkOS1jZTQzNjdiY2QxMDYiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjUyMDM0In0..qRhiM9VRk2yCBHi1WXBmlg.ZiLySDy13u_qLrytD1eWB5iHyRU7PxrPLn-eBN2nnMv2suzCBFj9Xpo4afOgaMbHSXnuDuf06mGJmHZL_D19-UfvAEwStWiwZMtTUDCzHJCGpgDzRO5TY92p3VWHNVxOsZXvDBsmoDseTk5yN1EwiMyU3DhTu9nhwxDKLLgOa-s.OVj-feVpGHNnLY-hMfA6DQ',
			drm: {
				licenseURL:
					'https://tvkcloud.anycast.nagra.com/TVKCLOUD/tkls/contentlicenseservice/v1/licenses',
				type: 'TVKey', // "com.tvkey.drm"
			},
		},
	},
	// OTT VOD Encrypted DASH - TVkey
	{
		name: 'VOD Encrypted DASH - TVKey(TENANTNAME) non-callback mode',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/scramble/bbb_prm_cenc_mpd/dash/connect-manifest-prm-pssh.mpd',
			type: 'application/dash+xml',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiIwZjExZjk1MC1kOTdlLTExZWItYjhiYy0wMjQyYWMxMzAwMDMiLCJzdG9yYWJsZSI6dHJ1ZSwidXNhZ2VSdWxlc1Byb2ZpbGVJZCI6IlRlc3QifV19.4_gvbWWbj0eVLLQ8KFKXPyFjvTVhqEcM58d9AZvOP3Y',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/tkls/contentlicenseservice/v1/licenses',
				type: 'TVKey', // "com.tvkey.drm"
			},
		},
		callbackMode: false,
	},
	{
		name: 'VOD Encrypted DASH - TVKey(TENANTNAME)',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/scramble/bbb_prm_cenc_mpd/dash/connect-manifest-prm-pssh.mpd',
			type: 'application/dash+xml',
			drm: {
				type: 'TVKey', // "com.tvkey.drm"
			},
		},
		license: {
			licenseURL:
				'https://tenantname.anycast.nagra.com/TENANTNAME/tkls/contentlicenseservice/v1/licenses',
			certificateURL: '',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiIwZjExZjk1MC1kOTdlLTExZWItYjhiYy0wMjQyYWMxMzAwMDMiLCJzdG9yYWJsZSI6dHJ1ZSwidXNhZ2VSdWxlc1Byb2ZpbGVJZCI6IlRlc3QifV19.4_gvbWWbj0eVLLQ8KFKXPyFjvTVhqEcM58d9AZvOP3Y',
		},
		callbackMode: true,
	},
	// OTT VOD Encrypted DASH - TVkey
	{
		name: 'DASH  - LIVE: Channel 4- TVKey(TVKCLOUD)',
		source: {
			src: 'https://replacemewithyourown.com/secureplayer/live-pmxo/Content/tvkey/Live/Channel(Channel4)/manifest.mpd',
			type: 'application/dash+xml',
			token: 'eyJraWQiOiI1ODc2OTAiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiIyMDZhNmE4NS1lYWIzLTRmZjEtODQxOS1lNjVkMWJhZTJkZjciLCJlbmNyeXB0aW9uTWV0aG9kIjoiUkFXX0FFU18xMjhfQ1RSX0NFTkMiLCJ1c2FnZVJ1bGVzUHJvZmlsZUlkIjoiVGVzdCJ9XX0.s7_elvCK4HsmX-x80yAL2g5HTLaOJjSpMT-aWdz-GaU',
			drm: {
				licenseURL:
					'https://tvkcloud.anycast.nagra.com/TVKCLOUD/tkls/contentlicenseservice/v1/licenses',
				type: 'TVKey', // "com.tvkey.drm"
			},
		},
	},
	{
		name: 'Big Buck Bunny SSM 2 sessions',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls6/scramble/bbb_sunflower_60fps_fmp4_fps_scramble/master-ssp.m3u8',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoic2FmYXJpMiJ9LCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJzZXNzaW9uQ29udHJvbCI6eyJtYXhTZXNzaW9ucyI6Miwic2Vzc2lvbkNvbnRyb2xFbmFibGVkIjp0cnVlfSwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5Ijp0cnVlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.Yz3itoLthexGELwGVigsQXAQUjf-TjJRuHHuTLYMFEg',
			type: 'application/x-mpegURL',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
				certificateURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Fairplay',
			},
		},
		contentId: '',
	},
	{
		name: 'Big Buck Bunny SSM 1000 sessions',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls6/scramble/bbb_sunflower_60fps_fmp4_fps_scramble/master-ssp.m3u8',
			token: 'eyJraWQiOiI2MTgyMzgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaW9zMTAwMCJ9LCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJzZXNzaW9uQ29udHJvbCI6eyJtYXhTZXNzaW9ucyI6MTAwMCwic2Vzc2lvbkNvbnRyb2xFbmFibGVkIjp0cnVlfSwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5Ijp0cnVlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.uHSVqlgaK_vKfL2wyuHcddGE1IcCzHLEaJ-YlK2gf2s',
			type: 'application/x-mpegURL',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
				certificateURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Fairplay',
			},
		},
		contentId: '',
	},
	{
		name: 'Channel 4 Live SSM 2 sessions',
		source: {
			src: 'https://replacemewithyourown.com/secureplayer/live-pmxo/Content/hls_fairplay_ssp/Live/Channel(Channel4)/Stream(04)/index.m3u8',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoic2FmYXJpMiJ9LCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiYzU4NmY4ZDAtOGYyMi00ZGExLTg2MTQtNjQ5MTQ5NDVmMTUwIl0sImNvbnRlbnRJZCI6IkNINF9GUFNfU1NQQVdTIiwic3RvcmFibGUiOnRydWUsInNlc3Npb25Db250cm9sIjp7Im1heFNlc3Npb25zIjoyLCJzZXNzaW9uQ29udHJvbEVuYWJsZWQiOnRydWV9LCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.CUqhIP0p7mA53U4-u_moOKKM2O-0_3aiwdliS0bExfs',
			type: 'application/x-mpegURL',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
				certificateURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
				ssmServerURL:
					'https://tenantname-ssm.anycast.nagra.com/TENANTNAME/ssm',
				type: 'Fairplay',
			},
		},
		contentId: '',
	},
];

const unFilteredSourceListEncryptedSSP = [
	{
		name: 'DASH - Aliens- Multi Audio (Widevine only)',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/customers/sfr/scramble/ssp_widevine_odfox_Aliens_HD_Subbed/odfox_Aliens_HD_Subbed.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMWNmZTMzOTYtMmE3Ni00ZDdkLWExZjgtMDRiYjgyNWUyNzMzIl0sImNvbnRlbnRJZCI6IndpZGV2aW5lX29kZm94X0FsaWVuc19IRF9TdWJiZWQiLCJzdG9yYWJsZSI6dHJ1ZSwiZW5jcnlwdGlvbk1ldGhvZCI6IlJBV19BRVNfMTI4X0NUUl9DRU5DIiwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5IjpmYWxzZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ._K1BC1US1QMDBmtE7IzDtaPKgIu6Rla80a_ZJxmSkbM,eyJrY0lkcyI6WyIxY2ZlMzM5Ni0yYTc2LTRkN2QtYTFmOC0wNGJiODI1ZTI3MzMiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..lMFjSXiyz8FN2YJbFfgC7g.iLc5Dr5_5hMTkUw5IU4Ca71HFz20ylikppvM53V8TuVyTRqTA9ptdagmqQXfknsDY78EMrLCNlVVImIQHf-D4-yYk4V-hFdMZXw1l9UFnkajwFPns90cMsY6U3U6JVtXAPPXemUrdWh08bAiq_aqMY0k_5u8VXEBG0VtryIl18A.uCPayccoQVM0tpHBPieJvg',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				type: 'Widevine', // "com.widevine.alpha"
			},
		},
	},
	{
		name: 'DASH - Aliens- Multi Audio (Playready only)',
		source: {
			src: 'https://replacemewithyourown.com/vod/dash/customers/sfr/scramble/ssp_playready_odfox_Aliens_HD_Subbed/odfox_Aliens_HD_Subbed.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMjlhODQwNDMtMThmYy00MmM0LWEyYzAtZTFiNTBiNmMzZGVlIl0sImNvbnRlbnRJZCI6InBsYXlyZWFkeV9vZGZveF9BbGllbnNfSERfU3ViYmVkIiwic3RvcmFibGUiOnRydWUsImVuY3J5cHRpb25NZXRob2QiOiJSQVdfQUVTXzEyOF9DVFJfQ0VOQyIsImRlZmF1bHRVc2FnZVJ1bGVzIjp7Im1pbkxldmVsIjowLCJkaWdpdGFsT25seSI6dHJ1ZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.Nx30R1AKkL56Yo9gXhtt1dCgWE9lGxb3hn27vKHJTfg,eyJrY0lkcyI6WyIyOWE4NDA0My0xOGZjLTQyYzQtYTJjMC1lMWI1MGI2YzNkZWUiXSwidHlwIjoiSldUIiwiZW5jIjoiQTEyOENCQy1IUzI1NiIsImFsZyI6ImRpciIsImtpZCI6IjI5Mjg0OCJ9..o7BOQcKDsEOOQNiKcb7OKw.ySAxGU1BS_uXckE-Huu1BAVfHsNQC13DMkL70ZQtCZmZ4JMF_le5n_e0fsidDC6fKAvbmroEC0Xp2_57TmeVHDSnppeu9yh7eFZ4bPZslSEYMG455ZO0jHGsouC7wu5lBq5Zl4crXgeJSm17LBvP2sD0ZrhHv6PWb1uXDXgEx4A.j1T62cf3n35-C8WdoG67hA',
			type: 'application/dash+xml',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				type: 'Playready',
			},
		},
	},
	{
		name: 'Channel 4 LIVE Encrypted PR',
		source: {
			type: 'application/dash+xml',
			src: 'https://replacemewithyourown.com/secureplayer/live-pmxo/Content/dash_7_cenc_ssp/Live/Channel(Channel4)/manifest.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiJjaGFubmVsNF9kYXNoX3VleDNYajBpIiwic3RvcmFibGUiOnRydWUsImRlZmF1bHRVc2FnZVJ1bGVzIjp7Im1pbkxldmVsIjowLCJkaWdpdGFsT25seSI6ZmFsc2UsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.2bpnSJjyUCGl7eYG1dgD7PC-zNJIp5H4rD9pltspeMo',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/prls/contentlicenseservice/v1/licenses',
				type: 'Playready',
			},
		},
	},
	{
		name: 'Channel 4 LIVE Encrypted WV',
		source: {
			type: 'application/dash+xml',
			src: 'https://replacemewithyourown.com/secureplayer/live-pmxo/Content/dash_7_cenc_ssp/Live/Channel(Channel4)/manifest.mpd',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiJjaGFubmVsNF9kYXNoX3VleDNYajBpIiwic3RvcmFibGUiOnRydWUsImRlZmF1bHRVc2FnZVJ1bGVzIjp7Im1pbkxldmVsIjowLCJkaWdpdGFsT25seSI6ZmFsc2UsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.2bpnSJjyUCGl7eYG1dgD7PC-zNJIp5H4rD9pltspeMo',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/wvls/contentlicenseservice/v1/licenses',
				type: 'Widevine',
			},
		},
	},
	{
		name: 'Channel 4 LIVE Encrypted FPS',
		source: {
			type: 'application/x-mpegURL',
			src: 'https://replacemewithyourown.com/secureplayer/live-pmxo/Content/hls_fairplay_ssp/Live/Channel(Channel4)/index.m3u8',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiJDSDRfRlBTX1NTUEFXUyIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.dPW7IORMhOIXUpVd7h1DxY38WchpuO1dxpK9WMJ9IHQ',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
				certificateURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
				type: 'Fairplay',
			},
		},
	},
	{
		name: 'SSP-Encrypted-Sunflower-60fps',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls6/scramble/bbb_sunflower_60fps_fmp4_fps_scramble/master-ssp.m3u8',
			type: 'application/x-mpegURL',
			drm: {
				licenseURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/licenses',
				certificateURL:
					'https://tenantname.anycast.nagra.com/TENANTNAME/fpls/contentlicenseservice/v1/certificates',
				type: 'Fairplay',
			},
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.ch1hZliH8J4qVeGcgGJFUFJqc4DxJ4iP_xGczf9yqHA',
		},
	},
];

// Example of Tizen userAgent:
// "Mozilla/5.0 (SMART-TV; LINUX; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/5.0 TV Safari/537.36"
const isSmartTv = window.navigator.userAgent.toLowerCase().includes('smart');
const isSafari =
	!isSmartTv &&
	window.navigator.userAgent.indexOf('Safari') !== -1 &&
	window.navigator.userAgent.indexOf('Chrome') === -1;

// Filter the source list so only HLS is shown for Safari, and only DASH otherwise
export const sourceListClear = unFilteredSourceListClear.filter(
	(stream) => isSafari === (stream.source.type === 'application/x-mpegURL'),
);

export const sourceListEncryptedSSM = unFilteredSourceListEncryptedSSM.filter(
	(stream) => isSafari === (stream.source.type === 'application/x-mpegURL'),
);

export const sourceListEncryptedSSP = unFilteredSourceListEncryptedSSP.filter(
	(stream) => isSafari === (stream.source.type === 'application/x-mpegURL'),
);

export const sourceList = [
	...sourceListClear,
	...sourceListEncryptedSSM,
	...sourceListEncryptedSSP,
];
