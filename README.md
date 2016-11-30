# lightboxkit
Analogue UIKit LightBox https://getuikit.com/docs/lightbox.html

## Get started

Include CSS and JS files 

```html
<script src="lightboxkit.js"></script>
<link rel="stylesheet" href="lightboxkit.css">
```
HTML

```html
<a title="Горы альбукерке" data-lightboxkit="{'group':'group1'}" href="https://getuikit.com/docs/images/placeholder_800x600_1.jpg?timestamp=111"><img style="width:300px;" src="https://getuikit.com/docs/images/placeholder_800x600_1.jpg" alt=""></a>
<a title="Горы Ганалулу" data-lightboxkit="{'group':'group1'}" href="https://getuikit.com/docs/images/placeholder_800x600_2.jpg?timestamp=111"><img style="width:300px;" src="https://getuikit.com/docs/images/placeholder_800x600_2.jpg" alt=""></a>
<a title="Горы МаунтинДью" data-lightboxkit="{'group':'group1'}" href="https://getuikit.com/docs/images/placeholder_800x600_3.jpg?timestamp=111"><img style="width:300px;" src="https://getuikit.com/docs/images/placeholder_800x600_3.jpg" alt=""></a>
<a title="Горы Сахары" data-lightboxkit="{'group':'group1'}" href="https://getuikit.com/docs/images/placeholder_800x600_4.jpg?timestamp=111"><img style="width:300px;" src="https://getuikit.com/docs/images/placeholder_800x600_4.jpg" alt=""></a>
```

It's all

or
```html
<a class="targets" href="https://getuikit.com/docs/images/placeholder_800x600_1.jpg?timestamp=111"><img style="width:300px;" src="https://getuikit.com/docs/images/placeholder_800x600_1.jpg" alt=""></a>
<a class="targets" href="https://getuikit.com/docs/images/placeholder_800x600_2.jpg?timestamp=111"><img style="width:300px;" src="https://getuikit.com/docs/images/placeholder_800x600_2.jpg" alt=""></a>
```
```javascript
lightboxkit('.targets', {
    group: 2
});
```