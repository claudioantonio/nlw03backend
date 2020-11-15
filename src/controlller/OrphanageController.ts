import {Request,Response} from 'express';
import {getRepository, UpdateQueryBuilder} from 'typeorm';
import * as yup from 'yup';

import orphanageView from '../views/orphanages_view';

import Orphanage from '../model/Orphanage';

export default {

    async index(request: Request,response: Response) {
        const orphanageRepository = getRepository(Orphanage);
        const orphanages = await orphanageRepository.find({
            relations: ['images']
        });
        return response.json(orphanageView.renderMany(orphanages));
    },

    async show(request: Request,response: Response) {
        const {id} = request.params;
        const orphanageRepository = getRepository(Orphanage);
        const orphanage = await orphanageRepository.findOneOrFail(id, {
            relations: ['images']
        });
        return response.json(orphanageView.render(orphanage));
    },

    async create(request: Request,response: Response) {
        const {
            name,
            latitude,
            longitude,
            about,
            instructions,
            opening_hours,
            open_on_weekends
        } = request.body;

        const requestImages = request.files as Express.Multer.File[];
        const images = requestImages.map( image => {
            return {path:image.filename};
        })

        const data = {
            name,
            latitude,
            longitude,
            about,
            instructions,
            opening_hours,
            open_on_weekends,
            images
        };
        const schema = yup.object().shape({
            name: yup.string().required(),
            latitude: yup.number().required(),
            longitude: yup.number().required(),
            about: yup.string().required().max(300),
            instructions: yup.string().required(),
            opening_hours: yup.string().required(),
            open_on_weekends: yup.boolean().required(),
            images: yup.array(yup.object().shape({
                path: yup.string().required()
            }))
        });

        await schema.validate(data, {
            abortEarly: false
        });

        const orphanageRepository = getRepository(Orphanage);
        const orphanage = orphanageRepository.create(data);
        await orphanageRepository.save(orphanage);
    
        return response.status(201).json(orphanage); 
    }
};