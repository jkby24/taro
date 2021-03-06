import 'weui'
import Nerv from 'nervjs'
import classNames from 'classnames'
import Swipers from 'swiper'

import 'swiper/dist/css/swiper.min.css'
import './style/index.scss'

let INSTANCE_ID = 0

class SwiperItem extends Nerv.Component {
  render () {
    const { className, style, itemId, children, ...restProps } = this.props
    const cls = classNames('swiper-slide', className)
    return <div
      className={cls}
      style={style}
      item-id={itemId}
      {...restProps}>
      {children}
    </div>
  }
}

const createEvent = type => {
  let e
  try {
    e = new TouchEvent(type)
  } catch (err) {
    e = document.createEvent('Event')
    e.initEvent(type, true, true)
  }
  return e
}

class Swiper extends Nerv.Component {
  constructor () {
    super(...arguments)
    this.$el = null
    this._id = INSTANCE_ID + 1
    INSTANCE_ID++
    this._$current = 0
    this._$width = 0
    this._$height = 0
  }

  componentDidMount () {
    const {
      autoplay = false,
      interval = 5000,
      duration = 500,
      current = 0,
      displayMultipleItems = 1,
      onChange,
      circular,
      vertical,
      onAnimationFinish,
      spaceBetween
    } = this.props

    const that = this
    const opt = {
      // 指示器
      pagination: { el: `.taro-swiper-${this._id} .swiper-pagination` },
      direction: vertical ? 'vertical' : 'horizontal',
      loop: circular,
      slidesPerView: parseInt(displayMultipleItems, 10),
      initialSlide: parseInt(current, 10),
      speed: parseInt(duration, 10),
      observer: true,
      on: {
        slideChange () {
          let e = createEvent('touchend')
          try {
            Object.defineProperty(e, 'detail', {
              enumerable: true,
              value: {
                current: this.realIndex
              }
            })
          } catch (err) {}
          that._$current = this.realIndex
          onChange && onChange(e)
        },
        transitionEnd () {
          let e = createEvent('touchend')
          try {
            Object.defineProperty(e, 'detail', {
              enumerable: true,
              value: {
                current: this.realIndex
              }
            })
          } catch (err) {}
          onAnimationFinish && onAnimationFinish(e)
        }
      }
    }

    // 自动播放
    if (autoplay) {
      opt.autoplay = {
        delay: parseInt(interval, 10),
        stopOnLastSlide: true,
        disableOnInteraction: false
      }
    }

    // 两端距离
    if (spaceBetween) {
      opt.spaceBetween = spaceBetween
    }

    this.mySwiper = new Swipers(this.$el, opt)
  }

  componentWillReceiveProps (nextProps) {
    if (this.mySwiper) {
      const nextCurrent = typeof nextProps.current === 'number' ? nextProps.current : this._$current || 0

      // 是否衔接滚动模式
      if (nextProps.circular) {
        this.mySwiper.loopDestroy()
        this.mySwiper.loopCreate()
        this.mySwiper.slideToLoop(parseInt(nextCurrent, 10)) // 更新下标
      } else {
        this.mySwiper.slideTo(parseInt(nextCurrent, 10)) // 更新下标
      }

      // 判断是否需要停止或开始自动轮播
      if (this.mySwiper.autoplay.running !== nextProps.autoplay) {
        if (nextProps.autoplay) {
          this.mySwiper.autoplay.start()
        } else {
          this.mySwiper.autoplay.stop()
        }
      }

      this.mySwiper.update() // 更新子元素
    }
  }

  componentDidUpdate () {
    if (!this.mySwiper) return
    if (this._$width !== this.mySwiper.width || this._$height !== this.mySwiper.height) {
      this.mySwiper.autoplay.stop()
      this.mySwiper.autoplay.start()
    }
    this._$width = this.mySwiper.width
    this._$height = this.mySwiper.height
  }

  componentWillUnmount () {
    this.$el = null
    if (this.mySwiper) this.mySwiper.destroy()
  }

  render () {
    const { className, style, indicatorColor, indicatorActiveColor } = this.props
    let defaultIndicatorColor = indicatorColor || 'rgba(0, 0, 0, .3)'
    let defaultIndicatorActiveColor = indicatorActiveColor || '#000'
    const cls = classNames(`taro-swiper-${this._id}`, 'swiper-container', className)
    const paginationCls = classNames(
      'swiper-pagination',
      {
        'swiper-pagination-hidden': !this.props.indicatorDots,
        'swiper-pagination-bullets': this.props.indicatorDots
      }
    )
    return (
      <div className={cls} style={style} ref={(el) => { this.$el = el }}>
        <div
          dangerouslySetInnerHTML={{
            __html: `<style type='text/css'>
            .taro-swiper-${this._id} .swiper-pagination-bullet { background: ${defaultIndicatorColor} }
            .taro-swiper-${this._id} .swiper-pagination-bullet-active { background: ${defaultIndicatorActiveColor} }
            </style>`
          }}
        />
        <div className='swiper-wrapper'>{this.props.children}</div>
        <div className={paginationCls} />
      </div>
    )
  }
}

export { Swiper, SwiperItem }
