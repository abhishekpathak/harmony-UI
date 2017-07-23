/**
 * Created by abhishek on 23/07/17.
 */

export function youtubeToHarmonyArray(youtube_arr) {
    let harmony_arr = [];
    for (let i = 0; i < youtube_arr.items.length; i++) {
        const youtube_item = youtube_arr.items[i];
        let harmony_item = {
            videoid: youtube_item.id.videoId,
            track: youtube_item.snippet.title
        };
        harmony_arr.push(harmony_item);
    }
    return harmony_arr;
}
