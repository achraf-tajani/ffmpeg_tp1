const fs = require('fs-extra');
const pathToFfmpeg = require('ffmpeg-static');
const util = require('util');
const Jimp = require('jimp');
const exec = util.promisify(require('child_process').exec);

// video editor setting
const videoEncoder = 'h264';
const inputFile = 'videos/input.mp4';
const outputFile = 'videos/output.mp4';

const inputFolder = 'temp/raw-frames';
const outputFolder = 'temp/edited-frames';
let currentProgress = 0;
(async function () {
  try {
    // chechProgress
    //Create
    log('we strat', 'On commence tous douuux :');
    log('File init', 'On commence initilize : ');
    fs.rmSync('temp', { recursive: true, force: true });
    await fs.mkdir('temp');
    await fs.mkdir(inputFolder);
    await fs.mkdir(outputFolder);

    log('File decode', 'On decode');
    await exec(
      `"${pathToFfmpeg}" -i ${inputFile} -vf scale=720:-1 ${inputFolder}/%d.png`
    );

    log('Rendring', ' On rend ');
    const frames = fs.readdirSync(inputFolder);
    for (let frameCount = 1; frameCount <= frames.length; frameCount++) {
      checkProgress(frameCount, frames.length);

      //check and progress
      //Read current frame
      let frame = await Jimp.read(`${inputFolder}/${frameCount}.png`);
      //Modifier frame
      frame = await modifyFrame(frame);
      // Save the frame
      await frame.writeAsync(`${outputFolder}/${frameCount}.png`);
    }

    log('File Encode', 'On Encode le file ');
    await exec(
      `"${pathToFfmpeg}" -start_number 1 -i ${outputFolder}/%d.png -vcodec ${videoEncoder} -pix_fmt yuv420p ${outputFile}`
    );
    log('Cleaning', 'On clean tous bazzaare');
    fs.rmSync('temp', { recursive: true, force: true });
  } catch (e) {
    error(e, 'catch : ');
  }
})();

function log(elm, message) {
  console.log(`${message}[${elm}]`);
}
function error(elm, message) {
  console.log(`ERROR : ${message}[${elm}]`);
}
const modifyFrame = async (frame) => {
  // Calculate the new height for 9:16 aspect ratio based on the current video width
  let newHeight = (16 * frame.bitmap.width) / 9;
  // video height must be an even numbre
  newHeight = newHeight % 2 === 0 ? newHeight : newHeight + 1;

  // Create new image width current new height and white background
  const newImage = new Jimp(frame.bitmap.width, newHeight, 'white');

  // add watermak
  const font = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
  newImage.print(font, 20, newImage.bitmap.height - 100, 'achraf.tajani');
  newImage.composite(frame, 0, newHeight / 2 - frame.bitmap.height / 2);
  return newImage;
};

const checkProgress = (curentFrame, totalFrames) => {
  const progres = (curentFrame / totalFrames) * 100;
  if (progres > curentFrame + 10) {
    const displayProgres = Math.floor(progres);
    console.log(`Progress ${displayProgres}`);
    currentProgress = displayProgres;
  }
};
