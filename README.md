
<!-- PROJECT SHIELDS -->

<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fgunsurvival%2Fgunsurvival3%2F&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=Visitors&edge_flat=true)](https://hits.seeyoufarm.com)
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->

<br />
<div align="center">
  <a href="https://github.com/gunsurvival/">
    <img src="https://avatars.githubusercontent.com/u/79581117" alt="Logo" width="80" >
  </a>
  <h3 align="center">GUNSURVIVAL 3 - 2D TOP-DOWN MULTIPLAYER GAME</h3>

<p align="center">
<p align="center">
	GunSurvival is an exciting survival game with multiple game modes, including multiplayer and battle royale. Players must survive in challenging environments, compete against others, and master various skills.
    <br />
    <br />
    <a href="http://khoakomlem-internal.ddns.net:1810/">Play Demo</a>
    ·
    <a href="https://github.com/gunsurvival/gunsurvival3/issues">Report Bug</a>
    ·
    <a href="https://github.com/gunsurvival/gunsurvival3/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project
**Gunsurvival 3** is an open-source multiplayer survival game with nice code structure, and performance. It includes fun game modes like battle royale, and survival, ... **Gunsurvival 3** is an implement of [multiplayer-world](https://github.com/gunsurvival/multiplayer-world) - the library provides new way of creating multiplayer game!
<br>
For more lib that I use, check out [Acknowledgments](https://github.com/gunsurvival/gunsurvival3/edit/main/README.md#acknowledgments)


<p align="right">(<a href="#readme-top">back to top</a>)</p>
<!-- GETTING STARTED -->

## Getting Started

To get a local game, copy up and running follow these simple example steps.

### Prerequisites

- Install [node.js](https://nodejs.org/)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/gunsurvival/gunsurvival3.git
   ```
2. Install packages (npm, yarn or pnpm)
   ```sh
   npm install
   ```
3. Run the server
   ```sh
    npm run server
   ```
 4. Run the client
	```ssh
	 npm run dev
	 ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments
Post that I read:
- [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/)
- [detect-collisions](https://www.npmjs.com/package/detect-collisions)
- [How to make your game run at 60fps](https://medium0.com/@tglaiel/how-to-make-your-game-run-at-60fps-24c61210fe75)

Library that I use:
- [multiplayer-world](https://github.com/gunsurvival/multiplayer-world): An abstract modification of [colyseus/schema](https://github.com/colyseus/schema) to support synchronization between the client and server, allowing the same game logic to run on both.
- [Colyseus](https://github.com/colyseus/colyseus): Server-side handling (Room, Client, State, ...)
- [detect-collisions](https://github.com/Prozi/detect-collisions): Detecting collisions between bodies
- [Pixijs](https://github.com/pixijs/pixijs): Powerful lib to render game graphics!
- [Nextjs](https://github.com/vercel/next.js) For client-side react web

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->

<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[forks-shield]: https://img.shields.io/github/forks/gunsurvival/gunsurvival3.svg?style=for-the-badge
[forks-url]: https://github.com/gunsurvival/gunsurvival3/network/members
[stars-shield]: https://img.shields.io/github/stars/gunsurvival/gunsurvival3.svg?style=for-the-badge
[stars-url]: https://github.com/gunsurvival/gunsurvival3/stargazers
[issues-shield]: https://img.shields.io/github/issues/gunsurvival/gunsurvival3.svg?style=for-the-badge
[issues-url]: https://github.com/gunsurvival/gunsurvival3/issues
[license-shield]: https://img.shields.io/github/license/gunsurvival/gunsurvival3.svg?style=for-the-badge
[license-url]: https://github.com/gunsurvival/gunsurvival3/blob/master/LICENSE.txt
