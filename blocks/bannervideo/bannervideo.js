export default function decorate(block) {
    console.log(block)
    const link = block.querySelector('a');
    const src = link ? link.getAttribute('href') : '';

    if (src && src.endsWith('.mp4')) {
        const video = document.createElement('video');
        // Set attributes
        video.muted = true; // Use property instead of setAttribute for better reliability
        video.autoplay = true;
        video.loop = true;
        video.playsInline = true; // camelCase for JS property
        video.innerHTML = `<source src="${src}" type="video/mp4">`;
        block.textContent = '';
        block.append(video);
        video.play().catch((error) => {
            console.warn("Video autoplay was blocked:", error);
        });
    }
}