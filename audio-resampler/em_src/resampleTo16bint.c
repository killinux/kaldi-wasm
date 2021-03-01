#include <stdlib.h>
#include <stdio.h>
#include <errno.h>
#include <emscripten.h>
#include "../src/samplerate.h"

EMSCRIPTEN_KEEPALIVE
SRC_STATE *converter;

EMSCRIPTEN_KEEPALIVE
int init_converter() {
    int error;
    converter = src_new(SRC_SINC_BEST_QUALITY, 1, &error);
    return error;
}

EMSCRIPTEN_KEEPALIVE
int resample(float *data_in, long data_in_length, short *data_out, double output_input_fs_ratio) {
    int error;
    float *converted;
    converted = (float *) malloc(data_in_length * sizeof(float));
    if (converted == NULL) {
        fprintf(stderr, "Could not allocate memory\n");
        return ENOMEM;
    }

    SRC_DATA data_info = {
        .data_in = data_in,
        .data_out = converted,
        .input_frames = data_in_length,
        .output_frames = data_in_length,
        .src_ratio = output_input_fs_ratio,
        .end_of_input = 0,
    };

    error = src_process(converter, &data_info);
    if (error != 0) {
        perror("Error when resampling");
        return error;
    }

    src_float_to_short_array(data_info.data_out, data_out, data_info.output_frames_gen);
    free(converted);

    return data_info.output_frames_gen;
} 

EMSCRIPTEN_KEEPALIVE
int reset() {
    return src_reset(converter);
}

EMSCRIPTEN_KEEPALIVE
int terminate() {
    SRC_STATE *freed = src_delete(converter);
    if (freed != NULL) {
        fprintf(stderr, "ERROR: could not free converter");
        return -1;
    }
    return 0;
}
