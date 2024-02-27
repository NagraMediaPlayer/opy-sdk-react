// Copyright (c) 2020--2023 Nagravision SA. All rights reserved.
export const sourceListClear = [
	{
		id: 1,
		External_Subtitles: [
			{
				Language: 'srt.one',
				MIME: 'application/x-subrip',
				URL: 'https://replacemewithyourown.com/vod/hls3/clear/DownloadToGo_Subtitle_MA_Apple/apple_bipbop.srt',
			},
			{
				Language: 'srt.two',
				MIME: 'application/x-subrip',
				URL: 'https://replacemewithyourown.com/vod/hls3/clear/DownloadToGo_Subtitle_MA_Apple/apple_bipbop.two.srt',
			},
		],
		name: 'Advanced Stream',
		source: {
			src: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
			type: 'application/dash+xml',
		},
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['CLEAR', 'ADVANCED', 'APPLE', 'BIPBOP', 'OPENSOURCE'],
	},
	{
		id: 2,
		External_Subtitles: [],
		name: 'Basic Stream',
		source: {
			src: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8',
			type: 'application/dash+xml',
		},
		AdTagURL:
			'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480' +
			'&iu=/124319096/external/ad_rule_samples&ciu_szs=300x250&ad_rule=1&impl=s&' +
			'gdfp_req=1&env=vp&output=vmap&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26' +
			'sample_ar%3Dpremidpost&cmsid=496&vid=short_onecue&correlator=;',
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['CLEAR', 'BASIC', 'APPLE', 'BIPBOP', '4X3', 'OPENSOURCE'],
	},
	{
		id: 3,
		External_Subtitles: [],
		name: 'Apple Basic Stream 16x9 with MA',
		source: {
			src: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
			type: 'application/dash+xml',
		},
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		AdTagURL:
			'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250,728x90&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dskippablelinear&correlator=',
		tags: ['CLEAR', '16X9', 'APPLE', 'BIPBOP', 'MULTIAUDIO', 'OPENSOURCE'],
	},
	{
		id: 4,
		External_Subtitles: [],
		name: 'HLSv4 Stream with MA',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls4/clear/MA_envivio_v_a_a_clear/index.m3u8',
			type: 'application/dash+xml',
		},
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['CLEAR', 'MULTIAUDIO'],
	},
	{
		id: 5,
		External_Subtitles: [],
		name: 'Big Buck Bunny 10min TS I-Frames',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls4/clear/bbb_iframe_playlist/ts/index.m3u8',
			type: 'application/dash+xml',
		},
		AdTagURL:
			'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250,728x90&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dredirecterror&nofb=1&correlator=',
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['HLS', 'VOD', 'CLEAR', 'BUNNY', '10MIN', 'IFRAMES'],
	},
	{
		id: 6,
		External_Subtitles: [],
		name: 'Elmo CC608 and CC708 - Clear',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls2/clear/CC_1080i_29_Mpeg2_608_708_Elmo.ts/index_cc_signalled.m3u8',
			type: 'application/dash+xml',
		},
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['CLEAR', 'CC608', 'CC708', 'MULTIAUDIO'],
	},
	{
		id: 7,
		External_Subtitles: [],
		name: 'BBC Live',
		source: {
			src: 'https://replacemewithyourown.com/secureplayer/live-harmonic/hls/clear/bbc1clear/index.m3u8',
			type: 'application/dash+xml',
		},
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['LIVE', 'CLEAR', 'BBC'],
	},
];

export const sourceListEncryptedSSM = [
	{
		id: 1,
		External_Subtitles: [],
		name: 'Elephants Dream SSM 2 sessions (FairPlay)',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls6/scramble/elephants_dream_24fps_fmp4_fps_scramble/master-ssp.m3u8',
			token: 'eyJraWQiOiI2MTgyMzgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaW9zMiJ9LCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJzZXNzaW9uQ29udHJvbCI6eyJtYXhTZXNzaW9ucyI6Miwic2Vzc2lvbkNvbnRyb2xFbmFibGVkIjp0cnVlfSwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5Ijp0cnVlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.MOD-K1dmvPJzyFxt0JlH5LYmY636bjnuNc9wkf4TKVY',
			type: 'application/dash+xml',
		},
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['Encyrpted', 'Byterange', 'I-Frames'],
	},
	{
		id: 2,
		External_Subtitles: [],
		name: 'Elephants Dream SSM 1000 sessions (FairPlay)',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls6/scramble/elephants_dream_24fps_fmp4_fps_scramble/master-ssp.m3u8',
			token: 'eyJraWQiOiI2MTgyMzgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaW9zMTAwMCJ9LCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJzZXNzaW9uQ29udHJvbCI6eyJtYXhTZXNzaW9ucyI6MTAwMCwic2Vzc2lvbkNvbnRyb2xFbmFibGVkIjp0cnVlfSwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5Ijp0cnVlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.uHSVqlgaK_vKfL2wyuHcddGE1IcCzHLEaJ-YlK2gf2s',
			type: 'application/dash+xml',
		},
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['Encyrpted', 'Byterange', 'I-Frames'],
	},
	{
		id: 3,
		External_Subtitles: [],
		name: 'Big Buck Bunny SSM 1000 sessions (FairPlay)',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls6/scramble/bbb_sunflower_60fps_fmp4_fps_scramble/master-ssp.m3u8',
			token: 'eyJraWQiOiI2MTgyMzgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoiaW9zMTAwMCJ9LCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJzZXNzaW9uQ29udHJvbCI6eyJtYXhTZXNzaW9ucyI6MTAwMCwic2Vzc2lvbkNvbnRyb2xFbmFibGVkIjp0cnVlfSwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5Ijp0cnVlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.uHSVqlgaK_vKfL2wyuHcddGE1IcCzHLEaJ-YlK2gf2s',
			type: 'application/dash+xml',
		},
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['Encyrpted', 'Byterange', 'I-Frames'],
	},
	{
		id: 4,
		External_Subtitles: [],
		name: 'Big Buck Bunny SSM 2 sessions (FairPlay)',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls6/scramble/bbb_sunflower_60fps_fmp4_fps_scramble/master-ssp.m3u8',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJkZXZpY2UiOnsiYWNjb3VudElkIjoic2FmYXJpMiJ9LCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJzZXNzaW9uQ29udHJvbCI6eyJtYXhTZXNzaW9ucyI6Miwic2Vzc2lvbkNvbnRyb2xFbmFibGVkIjp0cnVlfSwiZGVmYXVsdFVzYWdlUnVsZXMiOnsibWluTGV2ZWwiOjAsImRpZ2l0YWxPbmx5Ijp0cnVlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.Yz3itoLthexGELwGVigsQXAQUjf-TjJRuHHuTLYMFEg',
			type: 'application/dash+xml',
		},
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['Encyrpted', 'Byterange', 'I-Frames'],
	},
];

export const sourceListEncryptedSSP = [
	{
		id: 1,
		External_Subtitles: [],
		name: 'SSP Big Buck Bunny 10min Byterange I-Frames',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls4/scramble/bbb_iframe_playlist/byterange/index.m3u8',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMDYzMjFhODYtMzFhZi00OTcxLWJiMmItM2Y4YTA2YzUwZjZiIl0sImNvbnRlbnRJZCI6Ik5BTE0xMTM4Iiwic3RvcmFibGUiOnRydWUsImRlZmF1bHRVc2FnZVJ1bGVzIjp7Im1pbkxldmVsIjowLCJkaWdpdGFsT25seSI6dHJ1ZSwidW5wcm90ZWN0ZWREaWdpdGFsT3V0cHV0Ijp0cnVlfX1dfQ.J1Ml7jfPZiz-kHJpnTsCZgRZLEGZ13WpAi3In9h5j9s',
			type: 'application/dash+xml',
		},
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['Encyrpted', 'Byterange', 'I-Frames'],
	},
	{
		id: 2,
		External_Subtitles: [],
		name: 'HLS SSP FPS LIVE Channel 4 TS',
		source: {
			src: 'https://replacemewithyourown.com/secureplayer/live-pmxo/Content/hls_fairplay_ssp/Live/Channel(Channel4)/index.m3u8',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJjb250ZW50SWQiOiJDSDRfRlBTX1NTUEFXUyIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOmZhbHNlLCJ1bnByb3RlY3RlZERpZ2l0YWxPdXRwdXQiOnRydWV9fV19.dPW7IORMhOIXUpVd7h1DxY38WchpuO1dxpK9WMJ9IHQ',
			type: 'application/dash+xml',
		},
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['Encyrpted', 'Byterange', 'I-Frames'],
	},
	{
		id: 3,
		External_Subtitles: [],
		name: 'test SSP Doctors',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls5/scramble/doctors_smpte-tt-id3-png_subtitles_fairplay/index-ssp.m3u8',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.ch1hZliH8J4qVeGcgGJFUFJqc4DxJ4iP_xGczf9yqHA',
			type: 'application/dash+xml',
		},
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['Encyrpted', 'Byterange', 'I-Frames'],
	},
	{
		id: 4,
		External_Subtitles: [],
		name: 'SSP Multi Subtitle',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls5/scramble/screenID3_png_multi-subtitle_fairplay_encrypted/index-ssp.m3u8',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.ch1hZliH8J4qVeGcgGJFUFJqc4DxJ4iP_xGczf9yqHA',
			type: 'application/dash+xml',
		},
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['Encyrpted', 'Byterange', 'I-Frames'],
	},
	{
		id: 5,
		External_Subtitles: [],
		name: 'SSP Multi Subtitle tokenType nv-application-data',
		source: {
			src: 'https://replacemewithyourown.com/vod/hls5/scramble/screenID3_png_multi-subtitle_fairplay_encrypted/index-ssp.m3u8',
			token: 'eyJraWQiOiIyOTI4NDgiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2ZXIiOiIxLjAiLCJ0eXAiOiJDb250ZW50QXV0aFoiLCJjb250ZW50UmlnaHRzIjpbeyJkZWZhdWx0S2NJZHMiOlsiMTBmZjlhMzEtMTBiZC00ODgwLWIyMzEtZmZkZjg0ZGNhOGMyIl0sImNvbnRlbnRJZCI6IjJhNmY4NWI1LWM0MWYtNDYxZi04ZmYyLWFhM2MxOWE2MjljZCIsInN0b3JhYmxlIjp0cnVlLCJkZWZhdWx0VXNhZ2VSdWxlcyI6eyJtaW5MZXZlbCI6MCwiZGlnaXRhbE9ubHkiOnRydWUsInVucHJvdGVjdGVkRGlnaXRhbE91dHB1dCI6dHJ1ZX19XX0.ch1hZliH8J4qVeGcgGJFUFJqc4DxJ4iP_xGczf9yqHA',
			type: 'application/dash+xml',
		},
		tokenType: 'nv-application-data',
		__v: 0,
		headend: '5b2b78e7dac20f5011331290',
		tags: ['Encyrpted', 'Byterange', 'I-Frames'],
	},
];

export const sourceList = [
	...sourceListClear,
	...sourceListEncryptedSSM,
	...sourceListEncryptedSSP,
];
