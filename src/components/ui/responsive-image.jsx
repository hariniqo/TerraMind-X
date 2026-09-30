import * as React from "react"
import { cn } from "../../lib/utils"
import { buildSrcSet, buildTransformUrl, splitImageProps } from "./image-helpers"
import { useResponsiveImage } from "./use-responsive-image"

export const ResponsiveImage = React.forwardRef(
  ({ src, parsed, fittingType, focalPoint, quality, className, style, aspectRatio, onLoad, onSourceChange, ...props }, ref) => {
    const { wrapperRef, imgRef, loaded, options, handleLoad } = useResponsiveImage(
      { parsed, fittingType, focalPoint, quality, className, onLoad, onSourceChange }, ref
    )
    const { wrapperProps, imageProps } = splitImageProps(props)

    return (
      <span
        ref={wrapperRef}
        className={cn("inline-block relative", className)}
        style={{ aspectRatio, ...style }}
        {...wrapperProps}
        data-base44-image=""
        data-base44-image-src={src}
      >
        {/* Contain both image layers inside the padded content box without adding an edit target. */}
        <span data-source-location={undefined} className="block relative w-full h-full overflow-hidden">