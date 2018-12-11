<details>
  <summary>Old Readme</summary>  

# The FFZ Add-On Pack

The FrankerFaceZ Add-On Pack, or FFZ Add-On Pack / FFZ:AP for short, is an extension for the already existing popular Twitch extension [FrankerFaceZ](https://www.frankerfacez.com/).

Formerly known as BetterTTV Emotes for FrankerFaceZ (BTTV4FFZ), FFZ:AP aims to be exactly that, but better.

FFZ:AP is written to be modular, so adding new add-ons is relatively easy.  
As of 2.2 it uses ES6 to allow for extendable classes.  
So now there is one [base addon](src/addons/_addon.js) which has to be extended.  
Have a look at the [BetterTTV add-on file](src/addons/bttv.js) to see a working implementation.

Version 2.0.0 brought in the main add-on you love: **BTTV**.

As of version 2.0.7 it also includes a **GameWisp** add-on, with which you can use:
- GameWisp global emotes
- GameWisp sub emotes (on all channels, just like Twitch sub emotes)
- GameWisp sub badges (visible on the channel you are subbed on)

Another future update will bring in a **MaiWaifu** add-on, which includes a new design that is made from the ground up.

## Download / Website

If you haven't come here for the code, you probably want to download the extension!

Just follow [this link](http://ffzap.lordmau5.com/) and it should give you the suggested download :)

It currently supports Chrome, Firefox and Userscripts (Tampermonkey, Greasemonkey, ...)

## Development

Do you want to help make FFZ:AP better by fixing bugs you found in an add-on?  
Do you want to make an entirely new add-on?

You'll need the recommended version of [NodeJS](https://nodejs.org/) installed.  
Afterwards, download the repository to a local folder.
Once that is done, open a command prompt or terminal in the folder and run:  
`npm install`  
Afterwards, just run `npm run serve`, which will start a local server on port 3000 and listen to changes in the add-ons to build a minified version.  
In your browser, open up the console and set `localStorage.ffz_ap_debug_mode` to `true`, then (re-)load a Twitch website.

If everything worked properly, the console should print:  
`FFZ:AP: Development Server is present.`

Now you can just edit away. The webpack task is recompiling the script and you just need to refresh the Twitch page once it's done.

## Stay up to date!

Do you want to stay up to date with the newest things happening?  
Make sure to follow the [official FFZ:AP Twitter account](https://www.twitter.com/FFZ_Addon_Pack) or join the [official Discord server](https://discord.me/ffz-ap).

## Credits
**mieDax**: _For the kick-ass logo we got!_  
**Wolsk**: _For the developer / supporter badge!_  
**Jugachi**: _For reporting a ton of bugs during the lifespan of BTTV4FFZ, being an early FFZ:AP tester and being an early GameWisp sub emote tester!_
</details>

# The FFZ Add-On Pack

The FrankerFaceZ Add-On Pack, or FFZ Add-On Pack / FFZ:AP for short, is an extension for the already existing popular Twitch extension [FrankerFaceZ](https://www.frankerfacez.com/).

_This README is currently incomplete due to a whole revamp of the extension in it's core._

## Development

The recommended version of [NodeJS](https://nodejs.org/) is required.  
`npm install` in the directory will install all necessary modules.  
`npm run build` will build the specific modules into separate files (`demeter.js` containing all, `demeter-???.js` containing only the specific module)  
`npm start` will run a development server locally and will re-build the files if changes are detected.  
Additionally, `localStorage.ffz_ap_debug_mode = true;` needs to be run in the console on a Twitch page for FFZ:AP to try and load the script from the local development server.

## Stay up to date!

Do you want to stay up to date with the newest things happening?  
Make sure to follow the [official FFZ:AP Twitter account](https://www.twitter.com/FFZ_Addon_Pack) or join the [official Discord server](https://discord.me/ffz-ap).

## Credits
**mieDax**: _For the kick-ass logo we got!_  
**Wolsk**: _For the developer / supporter badge!_  
**Jugachi**: _For reporting a ton of bugs during the lifespan of BTTV4FFZ, being an early FFZ:AP tester and being an early GameWisp sub emote tester!_
</details>
