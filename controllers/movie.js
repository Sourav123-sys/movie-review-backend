const { isValidObjectId } = require("mongoose");
const Movie = require("../models/movie")

const cloudinary = require('cloudinary').v2

cloudinary.config({
    cloud_name: process.env.CLOUD_API_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true
});

exports.uploadTrailer = async (req, res) => {
    const { file } = req

    if (!file) {
        return res.status(200).json({ error: "video file is missing" })
    }

    const videoRes = await cloudinary.uploader.upload(file.path, { resource_type: "video" })
    console.log(videoRes, 'video res')

    const { secure_url: url, public_id } = videoRes

    res.status(201).json({ url, public_id })
}

exports.createMovie = async (req, res) => {
    const { file, body } = req


    const { title, storyLine, director, releaseDate, status, type, genres, tags, cast, writers, trailer, language } = body

    const newMovie = new Movie({
        title, storyLine, releaseDate, status, type, genres, tags, cast, trailer, language
    })

    if (director) {
        if (!isValidObjectId(director)) {
            return res.status(200).json({ error: "Invalid director id" })
        }

        newMovie.director = director;
    }

    if (writers) {
        for (let writerId of writers) {
            if (!isValidObjectId(writerId))
                return res.status(200).json({ error: "Invalid writer id" })
        }

        newMovie.writers = writers;
    }


    if (!file) {
        return res.status(200).json({ error: "poster file is missing" })
    }

    const posterRes = await cloudinary.uploader.upload(file.path, {
        transformation: {
            width: 1280,
            height: 720,
        },
        responsive_breakpoints: {
            create_derived: true,
            max_width: 640,
            max_images: 3,
        },
    });



    const { secure_url: url, public_id, responsive_breakpoints } = posterRes

    const finalPoster = { url, public_id, responsive: [] }

    const { breakPoints } = responsive_breakpoints[0]
    if (breakPoints.length) {
        for (let imgObj of breakPoints) {
            const { secure_url } = imgObj
            finalPoster.responsive.push(secure_url)
        }
    }
    newMovie.poster = finalPoster

    console.log(posterRes, 'posterRes ')
    console.log(posterRes.responsive_breakpoints[0].breakpoints);

    await newMovie.save()

    res.status(201).json({
        id: newMovie._id,
        title
    })
}

exports.updateMovieWithOutPoster = async (req, res) => {
    const { id } = req.params
    const movieId = id
    if (!isValidObjectId(movieId)) {
        return res.status(200).json({ error: "Invalid movie id" })
    }
    const movie = await Movie.findById(movieId)
    if (!movie) {
        return res.status(200).json({ error: "movie not found" })
    }

    const { title, storyLine, director, releaseDate, status, type, genres, tags, cast, writers, trailer, language } = req.body


    movie.title = title
    movie.tags = tags
    movie.storyLine = storyLine
    movie.status = status
    movie.language = language
    movie.rereleaseDate = releaseDate
    movie.type = type
    movie.cast = cast
    movie.trailer = trailer
    movie.genres = genres


    if (director) {
        if (!isValidObjectId(director)) {
            return res.status(200).json({ error: "Invalid director id" })
        }

        movie.director = director;
    }

    if (writers) {
        for (let writerId of writers) {
            if (!isValidObjectId(writerId))
                return res.status(200).json({ error: "Invalid writer id" })
        }

        movie.writers = writers;
    }
    await movie.save()

    res.json({ message: "Movie is updated successfully", movie })
}


exports.updateMovieWithPoster = async (req, res) => {
    const { id } = req.params
    const movieId = id
    if (!isValidObjectId(movieId)) {
        return res.status(200).json({ error: "Invalid movie id" })
    }
    if (!req.file) {
        return res.status(200).json({ error: "Movie poster  is missing" })
    }
    const movie = await Movie.findById(movieId)
    if (!movie) {
        return res.status(200).json({ error: "movie not found" })
    }

    const { title, storyLine, director, releaseDate, status, type, genres, tags, cast, writers, trailer, language } = req.body


    movie.title = title
    movie.tags = tags
    movie.storyLine = storyLine
    movie.status = status
    movie.language = language
    movie.rereleaseDate = releaseDate
    movie.type = type
    movie.cast = cast
    movie.trailer = trailer
    movie.genres = genres


    if (director) {
        if (!isValidObjectId(director)) {
            return res.status(200).json({ error: "Invalid director id" })
        }

        movie.director = director;
    }

    if (writers) {
        for (let writerId of writers) {
            if (!isValidObjectId(writerId))
                return res.status(200).json({ error: "Invalid writer id" })
        }

        movie.writers = writers;
    }

    const posterId = movie?.poster?.public_id
    if (posterId) {
        const { result } = cloudinary.uploader.destroy(posterId)
        console.log(result, 'result from update with poster')

        if (result !== 'ok') {
            return res.status(200).json({ error: "could not update poster at this moment" })
        }

    }


    const posterRes = await cloudinary.uploader.upload(req.file.path, {
        transformation: {
            width: 1280,
            height: 720,
        },
        responsive_breakpoints: {
            create_derived: true,
            max_width: 640,
            max_images: 3,
        },
    });



    const { secure_url: url, public_id, responsive_breakpoints } = posterRes

    const finalPoster = { url, public_id, responsive: [] }

    const { breakPoints } = responsive_breakpoints[0]
    if (breakPoints.length) {
        for (let imgObj of breakPoints) {
            const { secure_url } = imgObj
            finalPoster.responsive.push(secure_url)
        }
    }
    movie.poster = finalPoster


    await movie.save()

    res.json({ message: "Movie is updated successfully", movie })
}

exports.removeMovie = async (req, res) => {
    const { id } = req.params
    const movieId = id
    if (!isValidObjectId(movieId)) {
        return res.status(200).json({ error: "Invalid movie id" })
    }
    if (!req.file) {
        return res.status(200).json({ error: "Movie poster  is missing" })
    }
    const movie = await Movie.findById(movieId)
    if (!movie) {
        return res.status(200).json({ error: "movie not found" })
    }

    const posterId = movie?.poster?.public_id
    if (posterId) {
        const { result } = cloudinary.uploader.destroy(posterId)
        console.log(result, 'result from update with poster')

        if (result !== 'ok') {
            return res.status(200).json({ error: "could not remove poster from cloud" })
        }

    }

    const trailerId = movie?.trailer?.public_id
    if (!trailerId) {
        return res.status(200).json({ error: "could not found trailer from cloud" })

    }
    const { result } = cloudinary.uploader.destroy(trailerId, {
        resource_type: 'video'
    })
    if (result !== 'ok') {
        return res.status(200).json({ error: "could not remove trailer from cloud" })
    }



    await Movie.findByIdAndDelete(movieId)
    res.json({message: 'Movie deleted successfully'})


}
